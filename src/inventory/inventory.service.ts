import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { hasRole } from '@/common/role-check.util';
import { InventoryVariant, Role } from '@prisma/client';
import { CloudinaryService } from '@/cloudinary/cloudinary.service';
import { VariantsService } from './variants/variants.service';
import { getAccessibleLocalIds } from '@/common/access-locals.util';
import { generateSlug } from '@/utils/slug.util';
import { getPagination } from '@/common/pagination.util';
import { generateSku } from '../../utils/sku.util';
import { AuditService } from '@/audit/audit.service';
import { PlanLimitsService } from '@/common/plan-limits.service';
import { NotificationsService } from '@/notifications/notifications.service';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private variantsService: VariantsService,
    private audit: AuditService,
    private planLimits: PlanLimitsService,
    private notifications: NotificationsService,
  ) {}

  // Catálogo PÚBLICO (solo lectura) de un negocio por su slug — para la página
  // /booking/:slug cuando es de productos (restaurante, supermercado, zapatería…).
  // Agrupa por categoría; no expone costos ni stock. Sin carrito (eso es la
  // tienda online). Respeta el flag publicPageEnabled.
  async publicCatalog(slug: string) {
    const clean = (slug || '').trim().toLowerCase();
    if (!clean) throw new NotFoundException('Catálogo no disponible');
    const company = await this.prisma.company.findUnique({
      where: { slug: clean },
      select: { id: true, publicPageEnabled: true },
    });
    if (!company || company.publicPageEnabled === false) {
      throw new NotFoundException('Catálogo no disponible');
    }

    // Incluye TODOS los activos (también los NO disponibles): el front los
    // muestra marcados — "Agotado" (productos con stock) o "No disponible"
    // (menú). No oculta, para que el cliente vea la carta/catálogo completo.
    const products = await this.prisma.inventory.findMany({
      where: {
        companyId: company.id,
        status: 'ACTIVO' as any,
      },
      select: {
        id: true,
        name: true,
        description: true,
        salePrice: true,
        onlinePrice: true,
        available: true,
        trackStock: true,
        category: { select: { id: true, name: true } },
        images: {
          orderBy: { position: 'asc' },
          select: { url: true },
        },
        variants: {
          where: { isActive: true },
          select: { stock: true },
        },
        features: {
          where: { visible: true },
          orderBy: { order: 'asc' },
          select: { title: true },
        },
        specifications: {
          where: { visible: true },
          orderBy: { order: 'asc' },
          select: { key: true, value: true },
        },
      },
      orderBy: [{ categoryId: 'asc' }, { name: 'asc' }],
    });

    // Quita etiquetas HTML de la descripción (viene de editor enriquecido) para
    // que NO aparezca markup "impreso" en la página pública.
    const stripHtml = (s: string | null) =>
      s
        ? s
            .replace(/<br\s*\/?>/gi, ' ')
            .replace(/<\/p>/gi, ' ')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/gi, ' ')
            .replace(/&amp;/gi, '&')
            .replace(/\s+/g, ' ')
            .trim() || null
        : null;

    const groups = new Map<number, any>();
    for (const p of products) {
      const key = p.category?.id ?? 0;
      if (!groups.has(key)) {
        groups.set(key, {
          id: key,
          title: p.category?.name || 'Otros',
          products: [],
        });
      }
      const imgs = (p.images || []).map((im) => im.url).filter(Boolean);
      const stock = (p.variants || []).reduce(
        (a, v) => a + (Number(v.stock) || 0),
        0,
      );
      groups.get(key).products.push({
        id: p.id,
        name: p.name,
        description: stripHtml(p.description),
        price: p.onlinePrice ?? p.salePrice,
        image: imgs[0] || null,
        images: imgs,
        // "Etiquetas" (features visibles) para las cards y el detalle (PDP).
        tags: (p.features || []).map((f) => f.title).filter(Boolean),
        specs: (p.specifications || []).map((s) => ({
          key: s.key,
          value: s.value,
        })),
        // Disponibilidad: menú usa `available`; productos usan `stock`.
        available: p.available !== false,
        trackStock: p.trackStock !== false,
        stock,
      });
    }

    return { success: true, data: Array.from(groups.values()) };
  }

  // Carta ligera para gestionar disponibilidad (cocina): solo id, nombre y
  // disponible — sin costos ni datos sensibles.
  async menuAvailability(user: any) {
    const data = await this.prisma.inventory.findMany({
      where: { companyId: user.companyId, status: 'ACTIVO' as any },
      select: { id: true, name: true, available: true },
      orderBy: { name: 'asc' },
    });
    return { success: true, data };
  }

  // Disponibilidad del menú (restaurante): cocina/admin/dueño marcan un plato
  // como disponible o no. NO borra ni inactiva el producto; es un apagado
  // temporal de la carta. Al dejarlo NO disponible, avisa a los meseros.
  async setAvailability(id: number, available: boolean, user: any) {
    if (!hasRole(user.role, [Role.SUPER_ADMIN, Role.ADMIN, Role.COCINERO])) {
      throw new ForbiddenException('No autorizado');
    }
    const product = await this.prisma.inventory.findFirst({
      where: { id, companyId: user.companyId },
      select: { id: true, name: true },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');

    await this.prisma.inventory.update({
      where: { id },
      data: { available },
    });

    await this.audit.log({
      entity: 'inventory',
      entityId: id,
      action: 'UPDATE',
      user,
      changes: { available: { before: !available, after: available } },
    });

    // Aviso a los meseros cuando un plato queda NO disponible.
    if (!available) {
      await this.notifications.createForRoles(user.companyId, ['MESERO'], {
        type: 'MENU_ITEM_UNAVAILABLE',
        title: 'Plato no disponible',
        body: `"${product.name}" se marcó como NO disponible en la carta.`,
        url: '/dashboard/mesas',
      });
    }

    return {
      success: true,
      message: available
        ? 'Producto disponible'
        : 'Producto marcado como no disponible',
    };
  }

  // Búsqueda avanzada de productos y servicios
  async search(term: string, user: any) {
    const localIds = await getAccessibleLocalIds(this.prisma, user);

    const searchTerm = term.trim();

    if (!searchTerm) {
      return {
        success: true,
        data: [],
      };
    }

    const words = searchTerm
      .split(' ')
      .map((w) => w.trim())
      .filter(Boolean);

    if (localIds !== null && localIds.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    // ==========================
    // PRODUCTOS
    // ==========================

    const productWhere: any = {
      local: {
        companyId: user.companyId,
      },

      ...(localIds !== null && {
        localId: {
          in: localIds,
        },
      }),

      AND: words.map((word) => ({
        OR: [
          {
            name: {
              contains: word,
              mode: 'insensitive',
            },
          },

          {
            description: {
              contains: word,
              mode: 'insensitive',
            },
          },

          {
            barcode: {
              contains: word,
              mode: 'insensitive',
            },
          },

          {
            variants: {
              some: {
                sku: {
                  contains: word,
                  mode: 'insensitive',
                },
              },
            },
          },

          {
            variants: {
              some: {
                color: {
                  contains: word,
                  mode: 'insensitive',
                },
              },
            },
          },
        ],
      })),
    };

    const products = await this.prisma.inventory.findMany({
      where: productWhere,

      include: {
        variants: {
          where: {
            isActive: true,
          },
        },
        images: { orderBy: { position: 'asc' }, take: 1 },
      },

      take: 20,
    });

    const productResults = products.flatMap((product) =>
      product.variants.map((variant) => {
        let score = 0;

        const termLower = searchTerm.toLowerCase();

        if (product.name.toLowerCase().startsWith(termLower)) {
          score += 100;
        }

        if (product.name.toLowerCase().includes(termLower)) {
          score += 50;
        }

        if (product.description?.toLowerCase().includes(termLower)) {
          score += 20;
        }

        if (variant.sku?.toLowerCase().includes(termLower)) {
          score += 80;
        }

        if (variant.color?.toLowerCase().includes(termLower)) {
          score += 15;
        }

        if (product.barcode?.toLowerCase().includes(termLower)) {
          score += 90;
        }

        return {
          type: 'product',
          id: variant.id,
          name: product.name,
          color: variant.color,
          size: variant.size,
          sku: variant.sku,
          stock: variant.stock,
          price: product.salePrice,
          unit: product.unit,
          trackStock: product.trackStock,
          available: product.available !== false,
          image: product.images?.[0]?.url ?? null,
          localId: product.localId,
          score,
        };
      }),
    );

    // ==========================
    // SERVICIOS
    // ==========================

    const serviceWhere: any = {
      companyId: user.companyId,

      AND: words.map((word) => ({
        OR: [
          {
            name: {
              contains: word,
              mode: 'insensitive',
            },
          },

          {
            description: {
              contains: word,
              mode: 'insensitive',
            },
          },
        ],
      })),
    };

    const services = await this.prisma.service.findMany({
      where: serviceWhere,

      include: {
        serviceLocals: true,
      },

      take: 20,
    });

    const serviceResults = services.flatMap((service) =>
      service.serviceLocals
        .filter((local) =>
          localIds === null ? true : localIds.includes(local.localId),
        )
        .map((local) => {
          let score = 0;

          const termLower = searchTerm.toLowerCase();

          if (service.name.toLowerCase().startsWith(termLower)) {
            score += 100;
          }

          if (service.name.toLowerCase().includes(termLower)) {
            score += 50;
          }

          if (service.description?.toLowerCase().includes(termLower)) {
            score += 20;
          }

          return {
            type: 'service',
            id: service.id,
            name: service.name,
            duration: service.duration,
            price: local.price,
            localId: local.localId,
            score,
          };
        }),
    );

    // ==========================
    // UNIÓN + RELEVANCIA
    // ==========================

    const data = [...productResults, ...serviceResults]
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(({ score, ...item }) => item);

    return {
      success: true,
      data,
    };
  }

  async findAllPaginated(user: any, query: any) {
    const localIds = await getAccessibleLocalIds(this.prisma, user);
    const { limit } = getPagination(query);
    const requestedPage = Math.max(Number(query.page) || 1, 1);

    const where: any = {
      local: {
        companyId: user.companyId,
      },
    };

    if (localIds !== null) {
      if (localIds.length === 0) {
        where.localId = -1;
      } else {
        where.localId = { in: localIds };
      }
    }

    if (query.name) {
      where.name = { contains: query.name, mode: 'insensitive' };
    }

    if (query.barcode) {
      where.barcode = { contains: query.barcode, mode: 'insensitive' };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.localId) {
      where.local = {
        ...where.local,
        name: { contains: query.localId, mode: 'insensitive' },
      };
    }

    if (query.providerId) {
      where.provider = {
        is: { name: { contains: query.providerId, mode: 'insensitive' } },
      };
    }

    if (query.oldPrice) {
      const oldPrice = Number(query.oldPrice);
      if (!Number.isNaN(oldPrice)) {
        where.oldPrice = oldPrice;
      }
    }

    if (query.salePrice) {
      const salePrice = Number(query.salePrice);
      if (!Number.isNaN(salePrice)) {
        where.salePrice = salePrice;
      }
    }

    // Blindaje de paginación: si piden una página fuera de rango (p. ej. estaban
    // en la 2 y un filtro deja los resultados en 1 sola página), se recorta a la
    // última página CON datos, para no devolver una lista vacía.
    const total = await this.prisma.inventory.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(requestedPage, totalPages);
    const skip = (page - 1) * limit;

    const items = await this.prisma.inventory.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: { where: { isActive: true } },
        brand: true,
        provider: true,
        local: true,
        category: true,
      },
    });

    const canSeePurchasePrice = hasRole(user.role, [
      Role.SUPER_ADMIN,
      Role.ADMIN,
      Role.COORDINADOR,
      Role.AUXILIAR,
    ]);

    const data = items.map((product) => {
      const stock = product.variants.reduce((sum, v) => sum + v.stock, 0);

      if (!canSeePurchasePrice) {
        const { purchasePrice, ...rest } = product;
        return { ...rest, stock };
      }

      return { ...product, stock };
    });

    const auditMap = await this.audit.latestFor(
      'inventory',
      data.map((p) => p.id),
      user.companyId,
    );

    // Productos con una solicitud de disminución PENDIENTE (estado en la tabla).
    const pendingReqs = await this.prisma.stockChangeRequest.findMany({
      where: {
        companyId: user.companyId,
        status: 'PENDING',
        inventoryId: { in: data.map((p) => p.id) },
      },
      select: { inventoryId: true },
    });
    const pendingSet = new Set(pendingReqs.map((r) => r.inventoryId));

    return {
      success: true,
      data: data.map((p) => ({
        ...p,
        lastAudit: auditMap[p.id] || null,
        stockRequestPending: pendingSet.has(p.id),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Exportación a Excel: TODOS los productos de la empresa (sin paginar), con
  // variantes activas y nombres de local/categoría/marca/proveedor. Respeta los
  // locales accesibles del usuario y oculta el precio de compra a quien no debe verlo.
  async exportAll(user: any) {
    const localIds = await getAccessibleLocalIds(this.prisma, user);
    const where: any = { local: { companyId: user.companyId } };
    if (localIds !== null) {
      where.localId = localIds.length === 0 ? -1 : { in: localIds };
    }

    const items = await this.prisma.inventory.findMany({
      where,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        purchasePrice: true,
        salePrice: true,
        status: true,
        barcode: true,
        minStock: true,
        unit: true,
        local: { select: { name: true } },
        category: { select: { name: true } },
        brand: { select: { name: true } },
        provider: { select: { name: true } },
        variants: {
          where: { isActive: true },
          orderBy: { id: 'asc' },
          select: { color: true, size: true, stock: true, sku: true },
        },
      },
    });

    const canSeePurchasePrice = hasRole(user.role, [
      Role.SUPER_ADMIN,
      Role.ADMIN,
      Role.COORDINADOR,
      Role.AUXILIAR,
    ]);

    const data = items.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      purchasePrice: canSeePurchasePrice ? p.purchasePrice : null,
      salePrice: p.salePrice,
      status: p.status,
      barcode: p.barcode,
      minStock: p.minStock,
      unit: p.unit,
      localName: p.local?.name || '',
      categoryName: p.category?.name || '',
      brandName: p.brand?.name || '',
      providerName: p.provider?.name || '',
      variants: p.variants,
    }));

    return { success: true, data, total: data.length };
  }

  async findOne(id: number, user: any) {
    const product = await this.prisma.inventory.findFirst({
      // Scoping por EMPRESA (ancla de tenant). No por local.companyId: si se
      // borró la sede, localId queda null y el producto seguiría siendo editable.
      where: {
        id,
        companyId: user.companyId,
      },
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: { where: { isActive: true } },
        brand: true,
        category: true,
        provider: true,
        local: true,
        features: true,
        specifications: true,
      },
    });

    if (!product) throw new NotFoundException('Producto no encontrado');

    const stock = product.variants.reduce((sum, v) => sum + v.stock, 0);

    return { success: true, data: { ...product, stock } };
  }

  // Productos con alerta de stock bajo: minStock > 0 y stock total <= minStock.
  // Ordenados por los más críticos primero (mayor faltante).
  async getLowStock(user: any) {
    // Umbral por defecto de "por agotarse" cuando el producto no tiene alerta
    // de stock configurada (le quedan 1, 2 o 3).
    const LOW_STOCK_DEFAULT = 3;
    const localIds = await getAccessibleLocalIds(this.prisma, user);

    const where: any = {
      status: 'ACTIVO',
      // Excluye elaborados sin control de stock (platos): trackStock false.
      NOT: { trackStock: false },
      local: { companyId: user.companyId },
    };
    if (localIds !== null) {
      where.localId = localIds.length === 0 ? -1 : { in: localIds };
    }

    const products = await this.prisma.inventory.findMany({
      where,
      include: {
        variants: { where: { isActive: true }, select: { stock: true } },
        local: { select: { name: true } },
      },
    });

    const low = products
      .map((p) => {
        const stock = p.variants.reduce((s, v) => s + v.stock, 0);
        return {
          id: p.id,
          name: p.name,
          stock,
          minStock: p.minStock,
          unit: p.unit || 'UNIDAD',
          local: p.local?.name || null,
          // nº de presentaciones activas: 1 = se puede reponer rápido; >1 (con
          // colores/tallas) hay que editarlo para saber a cuál sumar.
          variantsCount: p.variants.length,
        };
      })
      // Sale si:
      //  - está AGOTADO (stock <= 0), o
      //  - tiene alerta configurada y está por debajo (stock <= minStock), o
      //  - NO tiene alerta pero le quedan pocos (<= 3): "por agotarse".
      .filter(
        (p) =>
          p.stock <= 0 ||
          (p.minStock > 0 && p.stock <= p.minStock) ||
          (p.minStock <= 0 && p.stock > 0 && p.stock <= LOW_STOCK_DEFAULT),
      )
      // Los agotados primero; luego los de menor stock.
      .sort((a, b) => {
        const sa = a.stock <= 0 ? -1e9 : a.stock;
        const sb = b.stock <= 0 ? -1e9 : b.stock;
        return sa - sb;
      });

    return { success: true, data: low };
  }

  // Reponer rápido: suma `amount` al stock de un producto de UNA sola
  // presentación (sin color/talla). Para productos con varias variantes hay que
  // usar la edición completa.
  async restock(id: number, amount: any, user: any) {
    const qty = Number(amount);
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new BadRequestException('La cantidad a reponer debe ser mayor a 0.');
    }
    const product = await this.prisma.inventory.findFirst({
      where: { id, companyId: user.companyId },
      include: { variants: { where: { isActive: true } } },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (product.variants.length !== 1) {
      throw new BadRequestException(
        'Este producto tiene varias presentaciones; edítalo para reponer.',
      );
    }
    const variant = product.variants[0];
    const updated = await this.prisma.inventoryVariant.update({
      where: { id: variant.id },
      data: { stock: { increment: qty } },
    });
    return {
      success: true,
      data: { id, stock: updated.stock, minStock: product.minStock },
    };
  }

  // Productos por vencer: con fecha de vencimiento dentro de los próximos
  // `days` días (o ya vencidos). Ordenados por el más próximo a vencer.
  async getExpiring(user: any, days = 30) {
    const localIds = await getAccessibleLocalIds(this.prisma, user);
    const now = new Date();
    const limit = new Date(now.getTime() + days * 86400000);

    const where: any = {
      status: 'ACTIVO',
      expiryDate: { not: null, lte: limit },
      local: { companyId: user.companyId },
    };
    if (localIds !== null) {
      where.localId = localIds.length === 0 ? -1 : { in: localIds };
    }

    const products = await this.prisma.inventory.findMany({
      where,
      select: {
        id: true,
        name: true,
        expiryDate: true,
        lot: true,
        local: { select: { name: true } },
      },
      orderBy: { expiryDate: 'asc' },
    });

    const data = products.map((p) => {
      const exp = p.expiryDate as Date;
      const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / 86400000);
      return {
        id: p.id,
        name: p.name,
        expiryDate: exp.toISOString(),
        lot: p.lot,
        local: p.local?.name || null,
        daysLeft,
      };
    });

    return { success: true, data };
  }

  // Verifica que la categoría, marca y proveedor indicados pertenezcan a la
  // empresa del usuario (evita asignar referencias de otra empresa).
  private async assertRefsOwnership(dto: any, companyId: number) {
    if (dto.categoryId) {
      const ok = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, companyId },
        select: { id: true },
      });
      if (!ok) throw new ForbiddenException('La categoría no es de tu empresa');
    }
    if (dto.brandId) {
      const ok = await this.prisma.brand.findFirst({
        where: { id: dto.brandId, companyId },
        select: { id: true },
      });
      if (!ok) throw new ForbiddenException('La marca no es de tu empresa');
    }
    if (dto.providerId) {
      const ok = await this.prisma.provider.findFirst({
        where: { id: dto.providerId, companyId },
        select: { id: true },
      });
      if (!ok) throw new ForbiddenException('El proveedor no es de tu empresa');
    }
  }

  async create(dto: CreateInventoryDto, user: any) {
    if (!hasRole(user.role, [Role.SUPER_ADMIN, Role.ADMIN, Role.RECEPCIONISTA])) {
      throw new ForbiddenException('No autorizado');
    }

    // Límite de productos según el plan de la empresa.
    await this.planLimits.assertCanCreate(user.companyId, 'products');

    // La categoría/marca/proveedor deben ser de la empresa.
    await this.assertRefsOwnership(dto, user.companyId);

    if (dto.localId) {
      const local = await this.prisma.local.findFirst({
        where: {
          id: dto.localId,
          companyId: user.companyId,
        },
      });

      if (!local) throw new ForbiddenException('Local no permitido');
    }

    if (dto.barcode) {
      const existing = await this.prisma.inventory.findFirst({
        where: { barcode: dto.barcode },
      });

      if (existing) {
        throw new BadRequestException('El código de barras ya existe');
      }
    }

    const baseSlug = generateSlug(dto.name);
    let slug = baseSlug;
    let counter = 1;

    while (await this.prisma.inventory.findFirst({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    // Unidad de medida: si llega del catálogo, su code define `unit` (UNIDAD/PESO).
    let unitId: number | null = null;
    let unitCode = dto.unit ?? 'UNIDAD';
    if (dto.unitId) {
      const u = await this.prisma.unitOfMeasure.findFirst({
        where: { id: Number(dto.unitId), companyId: user.companyId },
      });
      if (u) {
        unitId = u.id;
        unitCode = u.code;
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const product = await tx.inventory.create({
        data: {
          name: dto.name,
          description: dto.description,
          barcode: dto.barcode?.trim() ? dto.barcode : null,
          purchasePrice: dto.purchasePrice,
          oldPrice: dto.oldPrice ?? null,
          salePrice: dto.salePrice,
          onlinePrice: dto.onlinePrice ?? null,
          publishInEcommerce: dto.publishInEcommerce ?? false,
          status: dto.status,
          minStock: dto.minStock ?? 0,
          unit: unitCode,
          ...(unitId ? { unitOfMeasure: { connect: { id: unitId } } } : {}),
          trackStock: dto.trackStock ?? true,
          ...(dto.expiryDate ? { expiryDate: new Date(dto.expiryDate) } : {}),
          ...(dto.lot !== undefined && { lot: dto.lot || null }),
          slug,

          // Ancla de tenant: el producto siempre pertenece a la empresa.
          company: { connect: { id: user.companyId } },

          ...(dto.localId && {
            local: { connect: { id: dto.localId } },
          }),

          ...(dto.categoryId && {
            category: { connect: { id: dto.categoryId } },
          }),

          ...(dto.brandId && {
            brand: { connect: { id: dto.brandId } },
          }),

          ...(dto.providerId && {
            provider: { connect: { id: dto.providerId } },
          }),

          createdBy: { connect: { id: user.id } },
          updatedBy: { connect: { id: user.id } },
        },
      });

      const variants: InventoryVariant[] = [];

      for (const v of dto.variants ?? []) {
        const created = await tx.inventoryVariant.create({
          data: {
            inventoryId: product.id,
            color: v.color,
            size: v.size ?? null,
            stock: v.stock,
            sku: 'PENDING',
          },
        });

        const sku = generateSku(dto.name, created.sequence, created.color);

        const updated = await tx.inventoryVariant.update({
          where: { id: created.id },
          data: { sku },
        });

        variants.push(updated);
      }

      // Características y especificaciones (para la ficha/PDP).
      if (Array.isArray(dto.features) && dto.features.length) {
        await tx.inventoryFeature.createMany({
          data: dto.features
            .filter((f) => f.title?.trim())
            .map((f, i) => ({
              inventoryId: product.id,
              title: f.title.trim(),
              order: f.order ?? i,
              visible: f.visible !== false,
            })),
        });
      }
      if (Array.isArray(dto.specifications) && dto.specifications.length) {
        await tx.inventorySpecification.createMany({
          data: dto.specifications
            .filter((s) => s.key?.trim() && s.value?.trim())
            .map((s, i) => ({
              inventoryId: product.id,
              key: s.key.trim(),
              value: s.value.trim(),
              order: s.order ?? i,
              visible: s.visible !== false,
            })),
        });
      }

      return {
        success: true,
        message: 'Producto creado correctamente',
        data: { ...product, variants },
      };
    });

    await this.audit.log({
      entity: 'inventory',
      entityId: result.data.id,
      action: 'CREATE',
      user,
    });

    return result;
  }

  // CARGA MASIVA desde Excel (el front parsea y mapea las columnas del cliente a
  // estos campos normalizados). Resuelve categoría/marca/proveedor/local POR
  // NOMBRE (los crea si no existen), genera slug y SKU, y crea el producto con su
  // variante. Devuelve un resumen con creados y errores por fila (no aborta todo
  // por una fila mala). Se adapta a cualquier vertical: los campos que no apliquen
  // simplemente llegan vacíos.
  async bulkImport(
    user: any,
    dto: {
      items: Array<{
        row?: number;
        name?: string;
        salePrice?: number | string;
        purchasePrice?: number | string;
        stock?: number | string;
        categoryName?: string;
        brandName?: string;
        providerName?: string;
        localName?: string;
        barcode?: string;
        color?: string;
        unit?: string;
        minStock?: number | string;
        description?: string;
        // Stock por variante (color/talla) según la vertical. Si no viene, se usa
        // color/stock de arriba como una sola variante.
        variants?: Array<{
          color?: string;
          size?: string;
          stock?: number | string;
        }>;
      }>;
    },
  ) {
    const items = Array.isArray(dto?.items) ? dto.items : [];
    if (!items.length)
      throw new BadRequestException('No hay filas para importar.');
    if (items.length > 3000)
      throw new BadRequestException('Máximo 3000 filas por carga.');

    const num = (v: any) => {
      if (v === null || v === undefined || v === '') return 0;
      const n =
        typeof v === 'number' ? v : Number(String(v).replace(/[^\d.-]/g, ''));
      return Number.isFinite(n) ? n : 0;
    };
    const clean = (v: any) => String(v ?? '').trim();

    const defaultLocal = await this.prisma.local.findFirst({
      where: { companyId: user.companyId },
      orderBy: { id: 'asc' },
      select: { id: true },
    });

    // Cachés para no repetir consultas por cada fila.
    const localCache = new Map<string, number>();
    const catCache = new Map<string, number>();
    const brandCache = new Map<string, number>();
    const provCache = new Map<string, number>();

    const resolveLocal = async (name?: string) => {
      const key = clean(name).toLowerCase();
      if (!key) return defaultLocal?.id ?? null;
      if (localCache.has(key)) return localCache.get(key)!;
      let l = await this.prisma.local.findFirst({
        where: {
          companyId: user.companyId,
          name: { equals: clean(name), mode: 'insensitive' },
        },
        select: { id: true },
      });
      if (!l)
        l = await this.prisma.local.create({
          data: { name: clean(name), companyId: user.companyId },
          select: { id: true },
        });
      localCache.set(key, l.id);
      return l.id;
    };
    const resolveCategory = async (name: string, localId: number | null) => {
      const key = clean(name).toLowerCase();
      if (catCache.has(key)) return catCache.get(key)!;
      let c = await this.prisma.category.findFirst({
        where: {
          companyId: user.companyId,
          name: { equals: clean(name), mode: 'insensitive' },
        },
        select: { id: true },
      });
      if (!c)
        c = await this.prisma.category.create({
          data: { name: clean(name), companyId: user.companyId, localId },
          select: { id: true },
        });
      catCache.set(key, c.id);
      return c.id;
    };
    const resolveBrand = async (name: string) => {
      const key = clean(name).toLowerCase();
      if (brandCache.has(key)) return brandCache.get(key)!;
      let b = await this.prisma.brand.findFirst({
        where: {
          companyId: user.companyId,
          name: { equals: clean(name), mode: 'insensitive' },
        },
        select: { id: true },
      });
      if (!b)
        b = await this.prisma.brand.create({
          data: { name: clean(name), companyId: user.companyId },
          select: { id: true },
        });
      brandCache.set(key, b.id);
      return b.id;
    };
    const resolveProvider = async (name: string) => {
      const key = clean(name).toLowerCase();
      if (provCache.has(key)) return provCache.get(key)!;
      let p = await this.prisma.provider.findFirst({
        where: {
          companyId: user.companyId,
          name: { equals: clean(name), mode: 'insensitive' },
        },
        select: { id: true },
      });
      if (!p)
        p = await this.prisma.provider.create({
          data: { name: clean(name), companyId: user.companyId },
          select: { id: true },
        });
      provCache.set(key, p.id);
      return p.id;
    };

    const errors: Array<{ row: number; name: string; message: string }> = [];
    let created = 0;

    for (let i = 0; i < items.length; i++) {
      const it = items[i] || {};
      const rowNum = Number(it.row) || i + 2; // fila de Excel (encabezado = 1)
      const name = clean(it.name);
      try {
        if (!name) {
          errors.push({ row: rowNum, name: '', message: 'Falta el nombre' });
          continue;
        }
        const salePrice = num(it.salePrice);
        if (!(salePrice > 0)) {
          errors.push({
            row: rowNum,
            name,
            message: 'Falta el precio de venta (o es 0)',
          });
          continue;
        }
        const purchasePrice = num(it.purchasePrice);
        const stock = num(it.stock);

        const localId = await resolveLocal(it.localName);
        const categoryId = clean(it.categoryName)
          ? await resolveCategory(it.categoryName!, localId)
          : null;
        const brandId = clean(it.brandName)
          ? await resolveBrand(it.brandName!)
          : null;
        const providerId = clean(it.providerName)
          ? await resolveProvider(it.providerName!)
          : null;

        // Slug único.
        const base = generateSlug(name);
        let slug = base;
        let c = 1;
        while (await this.prisma.inventory.findFirst({ where: { slug } })) {
          slug = `${base}-${c++}`;
        }

        await this.prisma.$transaction(async (tx) => {
          const product = await tx.inventory.create({
            data: {
              name,
              description: clean(it.description) || null,
              barcode: clean(it.barcode) || null,
              purchasePrice,
              salePrice,
              publishInEcommerce: false,
              status: 'ACTIVO',
              minStock: num(it.minStock),
              unit: clean(it.unit).toUpperCase() || 'UNIDAD',
              slug,
              company: { connect: { id: user.companyId } },
              ...(localId && { local: { connect: { id: localId } } }),
              ...(categoryId && {
                category: { connect: { id: categoryId } },
              }),
              ...(brandId && { brand: { connect: { id: brandId } } }),
              ...(providerId && {
                provider: { connect: { id: providerId } },
              }),
              createdBy: { connect: { id: user.id } },
              updatedBy: { connect: { id: user.id } },
            },
          });
          // Variantes según la vertical: si llega `variants` (color/talla), se
          // crean todas; si no, una sola variante con el stock de la fila.
          const variantList =
            Array.isArray(it.variants) && it.variants.length
              ? it.variants.map((v) => ({
                  color: clean(v.color) || 'ÚNICO',
                  size: clean(v.size) || null,
                  stock: num(v.stock),
                }))
              : [{ color: clean(it.color) || 'ÚNICO', size: null, stock }];

          for (const v of variantList) {
            const variant = await tx.inventoryVariant.create({
              data: {
                inventoryId: product.id,
                color: v.color,
                size: v.size,
                stock: v.stock,
                sku: 'PENDING',
              },
            });
            const sku = generateSku(name, variant.sequence, variant.color);
            await tx.inventoryVariant.update({
              where: { id: variant.id },
              data: { sku },
            });
          }
        });
        created++;
      } catch (e: any) {
        errors.push({
          row: rowNum,
          name,
          message: e?.message || 'No se pudo crear el producto',
        });
      }
    }

    return {
      success: true,
      data: { total: items.length, created, failed: errors.length, errors },
    };
  }

  async update(id: number, dto: UpdateInventoryDto, user: any) {
    if (!hasRole(user.role, [Role.SUPER_ADMIN, Role.ADMIN, Role.RECEPCIONISTA])) {
      throw new ForbiddenException('No autorizado');
    }

    const before = (await this.findOne(id, user)).data;

    // La categoría/marca/proveedor deben ser de la empresa.
    await this.assertRefsOwnership(dto, user.companyId);

    // Unidad de medida del catálogo: deriva `unit` (UNIDAD/PESO).
    let unitPatch: any = {};
    if (dto.unitId !== undefined) {
      if (dto.unitId) {
        const u = await this.prisma.unitOfMeasure.findFirst({
          where: { id: Number(dto.unitId), companyId: user.companyId },
        });
        if (u) unitPatch = { unitId: u.id, unit: u.code };
      } else {
        unitPatch = { unitId: null };
      }
    }

    const updated = await this.prisma.inventory.update({
      where: { id },
      data: {
        ...unitPatch,
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.barcode !== undefined && { barcode: dto.barcode }),
        ...(dto.purchasePrice !== undefined && {
          purchasePrice: dto.purchasePrice,
        }),
        ...(dto.oldPrice !== undefined && { oldPrice: dto.oldPrice }),
        ...(dto.salePrice !== undefined && { salePrice: dto.salePrice }),
        ...(dto.onlinePrice !== undefined && { onlinePrice: dto.onlinePrice }),
        ...(dto.publishInEcommerce !== undefined && {
          publishInEcommerce: dto.publishInEcommerce,
        }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.minStock !== undefined && { minStock: dto.minStock }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
        ...(dto.trackStock !== undefined && { trackStock: dto.trackStock }),
        ...(dto.expiryDate !== undefined && {
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        }),
        ...(dto.lot !== undefined && { lot: dto.lot || null }),

        ...(dto.localId && {
          local: { connect: { id: dto.localId } },
        }),

        ...(dto.categoryId && {
          category: { connect: { id: dto.categoryId } },
        }),

        ...(dto.brandId && {
          brand: { connect: { id: dto.brandId } },
        }),

        ...(dto.providerId && {
          provider: { connect: { id: dto.providerId } },
        }),

        updatedBy: { connect: { id: user.id } },
      },
    });

    if (Array.isArray(dto.variants)) {
      // Solo dueño/administrador pueden bajar stock desde la edición. Para los
      // demás roles el stock nunca disminuye por aquí (se conserva); las bajas
      // van por la solicitud de aprobación (POST /stock-requests).
      const allowDecrease = hasRole(user.role, [Role.SUPER_ADMIN, Role.ADMIN]);
      await this.variantsService.syncVariants(id, dto.variants, user, {
        allowDecrease,
      });
    }

    // Características / especificaciones: se sincroniza reemplazando (maneja
    // crear, editar y eliminar por ítem en una sola operación). Solo si vienen
    // en el DTO (undefined = no tocar).
    if (Array.isArray(dto.features)) {
      await this.prisma.inventoryFeature.deleteMany({ where: { inventoryId: id } });
      const rows = dto.features
        .filter((f) => f.title?.trim())
        .map((f, i) => ({
          inventoryId: id,
          title: f.title.trim(),
          order: f.order ?? i,
          visible: f.visible !== false,
        }));
      if (rows.length) await this.prisma.inventoryFeature.createMany({ data: rows });
    }
    if (Array.isArray(dto.specifications)) {
      await this.prisma.inventorySpecification.deleteMany({
        where: { inventoryId: id },
      });
      const rows = dto.specifications
        .filter((s) => s.key?.trim() && s.value?.trim())
        .map((s, i) => ({
          inventoryId: id,
          key: s.key.trim(),
          value: s.value.trim(),
          order: s.order ?? i,
          visible: s.visible !== false,
        }));
      if (rows.length)
        await this.prisma.inventorySpecification.createMany({ data: rows });
    }

    const changes = this.audit.diff(before, dto, [
      'name',
      'barcode',
      'description',
      'purchasePrice',
      'salePrice',
      'oldPrice',
      'onlinePrice',
      'status',
      'localId',
      'providerId',
      'categoryId',
      'brandId',
    ]);
    await this.audit.log({
      entity: 'inventory',
      entityId: id,
      action: 'UPDATE',
      user,
      changes,
    });

    return {
      success: true,
      message: 'Producto actualizado correctamente',
      data: updated,
    };
  }

  async remove(id: number, user: any) {
    const product = await this.prisma.inventory.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
      include: { images: true },
    });

    if (!product) throw new NotFoundException('Producto no encontrado');

    for (const img of product.images) {
      await this.cloudinaryService.deleteImage(img.publicId).catch(() => null);
    }

    await this.prisma.inventory.delete({ where: { id } });

    await this.audit.log({
      entity: 'inventory',
      entityId: id,
      action: 'DELETE',
      user,
    });

    return { success: true, message: 'Producto eliminado' };
  }

  async syncProductImages(
    inventoryId: number,
    files: Express.Multer.File[],
    keepImageIds: number[],
    order: string[],
    user: any,
  ) {
    const product = await this.prisma.inventory.findFirst({
      where: {
        id: inventoryId,
        companyId: user.companyId,
      },
      include: {
        images: true,
        category: true,
        brand: true,
      },
    });

    if (!product) throw new NotFoundException('Producto no encontrado');

    const folder = `inventory/${product.category?.name || 'general'}`;

    await this.prisma.$transaction(async (tx) => {
      // 1) Eliminar las que ya no se conservan (de Cloudinary y de la BD).
      if (Array.isArray(keepImageIds)) {
        const toDelete = product.images.filter(
          (img) => !keepImageIds.includes(img.id),
        );

        for (const img of toDelete) {
          await this.cloudinaryService.deleteImage(img.publicId).catch(() => null);
          await tx.inventoryImage.delete({ where: { id: img.id } });
        }
      }

      // 2) Subir las nuevas (posición temporal alta para no chocar).
      const newImageIds: number[] = [];
      if (files) {
        for (let i = 0; i < files.length; i++) {
          const upload = await this.cloudinaryService.uploadImage(
            files[i],
            folder,
          );
          const created = await tx.inventoryImage.create({
            data: {
              inventoryId,
              url: upload.url,
              publicId: upload.publicId,
              position: 1000 + i,
            },
          });
          newImageIds.push(created.id);
        }
      }

      // 3) Reposicionar TODO según el orden final (id existente o 'NEW'). Así se
      // persiste el reordenar y la imagen "Principal" (posición 0).
      if (Array.isArray(order) && order.length) {
        let newIdx = 0;
        for (let pos = 0; pos < order.length; pos++) {
          const token = order[pos];
          if (token === 'NEW') {
            const imgId = newImageIds[newIdx++];
            if (imgId != null) {
              await tx.inventoryImage.update({
                where: { id: imgId },
                data: { position: pos },
              });
            }
          } else {
            const imgId = Number(token);
            if (keepImageIds.includes(imgId)) {
              await tx.inventoryImage.update({
                where: { id: imgId },
                data: { position: pos },
              });
            }
          }
        }
      } else {
        // Compatibilidad: sin orden, las nuevas quedan al final.
        const start = keepImageIds?.length ?? 0;
        for (let i = 0; i < newImageIds.length; i++) {
          await tx.inventoryImage.update({
            where: { id: newImageIds[i] },
            data: { position: start + i },
          });
        }
      }
    });

    return { success: true, message: 'Imágenes sincronizadas' };
  }
}
