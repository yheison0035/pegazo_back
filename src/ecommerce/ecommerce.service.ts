import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { MailService } from '@/mail/mail.service';
import { CreateEcommerceOrderDto } from './dto/create-ecommerce-order.dto';
import { PaymentMethod } from '@prisma/client';
import { WebsiteContext } from '@/modules/website/interfaces/website-context.interface';
import {
  quoteShipping,
  pickOption,
  isNoChargeMode,
} from './shipping.util';

const SORT_OPTIONS = [
  { label: 'Precio: menor a mayor', value: 'price_asc' },
  { label: 'Precio: mayor a menor', value: 'price_desc' },
  { label: 'A - Z', value: 'name_asc' },
  { label: 'Z - A', value: 'name_desc' },
];

@Injectable()
export class EcommerceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  /**
   * Precio que ve el cliente en la TIENDA ONLINE.
   * - price   = precio de tienda online (onlinePrice). Si el dueño no lo definió,
   *             cae al precio de venta (salePrice) para no romper tiendas ya
   *             activas. El salePrice es el precio de la tienda FÍSICA.
   * - oldPrice = "precio anteriormente" (tachado), si es mayor al actual.
   * - discount = % de descuento sobre el precio actual.
   */
  private priceInfo(product: any) {
    const price =
      product.onlinePrice != null ? product.onlinePrice : product.salePrice;
    const oldPrice =
      product.oldPrice && product.oldPrice > price ? product.oldPrice : null;
    const discount = oldPrice
      ? Math.round(((oldPrice - price) / oldPrice) * 100)
      : 0;
    return { price, oldPrice, discount };
  }

  /**
   * Convierte un nombre en el slug que usan las URLs de la tienda.
   * Debe dar el mismo resultado que el slug del sitemap y el del front.
   */
  private slugify(value: string) {
    return (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  // Imprime categorias
  async getCategoriesWithProducts(website: WebsiteContext) {
    const { localId } = website;

    const categories = await this.prisma.category.findMany({
      where: {
        localId,
        status: 'ACTIVO',
      },
      orderBy: { name: 'asc' },
      include: {
        inventories: {
          where: {
            localId: localId,
            status: 'ACTIVO',
          },
          include: {
            images: {
              orderBy: { position: 'asc' },
            },
            variants: true,
            brand: true,
            features: { orderBy: { order: 'asc' } },
            specifications: { orderBy: { order: 'asc' } },
          },
        },
      },
    });

    const data = categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      products: category.inventories.map((product) => {
        const stock = product.variants.reduce((sum, v) => sum + v.stock, 0);

        const { price, oldPrice, discount } = this.priceInfo(product);

        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price,
          unit: product.unit ?? 'UNIDAD',
          trackStock: product.trackStock,
          oldPrice,
          discount,
          stock,
          brand: product.brand?.name ?? null,
          images: product.images.map((img) => img.url),
        };
      }),
    }))
      // Solo categorías CON productos: si una categoría no tiene productos
      // activos, no se muestra en el menú de la tienda.
      .filter((category) => category.products.length > 0);

    return {
      success: true,
      data,
    };
  }

  // ---- Envíos: cotización por destino (transportadoras) ----

  /**
   * Opciones de envío para un destino y subtotal. Lo consume el checkout para
   * mostrar costo + tiempo de entrega al elegir la ciudad/departamento.
   */
  quoteShippingOptions(
    website: WebsiteContext,
    opts: { department?: string; subtotal?: number; carrierId?: string },
  ) {
    const storeShipping = (website.company as any)?.storeShipping || null;
    const subtotal = Math.max(0, Number(opts.subtotal) || 0);
    const options = quoteShipping(
      storeShipping,
      opts.department,
      subtotal,
      opts.carrierId,
    );
    return { success: true, data: options };
  }

  // ---- Favoritos del cliente de la tienda online ----

  /**
   * Lista de productos favoritos del cliente, en la MISMA forma que la card de
   * la tienda (para reusar el ProductCard del front). Solo devuelve productos
   * activos; si un favorito quedó inactivo/eliminado, no se muestra.
   */
  async getFavorites(customerId: number) {
    const favorites = await this.prisma.customerFavorite.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        inventory: {
          include: {
            category: true,
            brand: true,
            images: { orderBy: { position: 'asc' } },
            variants: true,
          },
        },
      },
    });

    const data = favorites
      .filter((f) => f.inventory && f.inventory.status === 'ACTIVO')
      .map((f) => {
        const product = f.inventory;
        const stock = product.variants.reduce((s, v) => s + v.stock, 0);
        const colors = product.variants
          .filter((v) => product.trackStock === false || v.stock > 0)
          .map((v) => ({
            variantId: v.id,
            name: v.color,
            size: v.size,
            stock: v.stock,
          }));
        const { price, oldPrice, discount } = this.priceInfo(product);

        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price,
          unit: product.unit ?? 'UNIDAD',
          trackStock: product.trackStock,
          oldPrice,
          discount,
          stock,
          colors,
          brand: product.brand?.name ?? null,
          category: product.category ? this.slugify(product.category.name) : null,
          image: product.images[0]?.url ?? null,
          images: product.images.map((img) => img.url),
        };
      });

    return { success: true, data };
  }

  /** IDs de los productos favoritos del cliente (para pintar el corazón). */
  async getFavoriteIds(customerId: number) {
    const rows = await this.prisma.customerFavorite.findMany({
      where: { customerId },
      select: { inventoryId: true },
    });
    return { success: true, data: rows.map((r) => r.inventoryId) };
  }

  /** Marca un producto como favorito (idempotente). */
  async addFavorite(
    website: WebsiteContext,
    customerId: number,
    inventoryId: number,
  ) {
    const product = await this.prisma.inventory.findFirst({
      where: { id: inventoryId, localId: website.localId },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Producto no encontrado.');

    await this.prisma.customerFavorite.upsert({
      where: { customerId_inventoryId: { customerId, inventoryId } },
      create: { customerId, inventoryId },
      update: {},
    });
    return { success: true };
  }

  /** Quita un producto de favoritos (idempotente). */
  async removeFavorite(customerId: number, inventoryId: number) {
    await this.prisma.customerFavorite.deleteMany({
      where: { customerId, inventoryId },
    });
    return { success: true };
  }

  // ---- Direcciones guardadas del cliente ----

  /** Lista de direcciones del cliente (la predeterminada primero). */
  async listAddresses(customerId: number) {
    const data = await this.prisma.customerAddress.findMany({
      where: { customerId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return { success: true, data };
  }

  /** Crea una dirección. Si es la primera o se marca por defecto, se ajusta. */
  async createAddress(customerId: number, dto: any) {
    const count = await this.prisma.customerAddress.count({
      where: { customerId },
    });
    // La primera dirección siempre queda como predeterminada.
    const isDefault = count === 0 ? true : !!dto.isDefault;

    if (isDefault) {
      await this.prisma.customerAddress.updateMany({
        where: { customerId },
        data: { isDefault: false },
      });
    }

    const created = await this.prisma.customerAddress.create({
      data: {
        customerId,
        label: dto.label?.trim() || null,
        department: dto.department.trim(),
        city: dto.city.trim(),
        neighborhood: dto.neighborhood.trim(),
        address: dto.address.trim(),
        addressDetail: dto.addressDetail?.trim() || null,
        isDefault,
      },
    });
    return { success: true, data: created };
  }

  /** Actualiza una dirección del propio cliente. */
  async updateAddress(customerId: number, id: number, dto: any) {
    const existing = await this.prisma.customerAddress.findFirst({
      where: { id, customerId },
    });
    if (!existing) throw new NotFoundException('Dirección no encontrada.');

    if (dto.isDefault === true) {
      await this.prisma.customerAddress.updateMany({
        where: { customerId },
        data: { isDefault: false },
      });
    }

    const data: any = {};
    if (dto.label !== undefined) data.label = dto.label?.trim() || null;
    if (dto.department !== undefined) data.department = dto.department.trim();
    if (dto.city !== undefined) data.city = dto.city.trim();
    if (dto.neighborhood !== undefined)
      data.neighborhood = dto.neighborhood.trim();
    if (dto.address !== undefined) data.address = dto.address.trim();
    if (dto.addressDetail !== undefined)
      data.addressDetail = dto.addressDetail?.trim() || null;
    if (dto.isDefault !== undefined) data.isDefault = !!dto.isDefault;

    const updated = await this.prisma.customerAddress.update({
      where: { id },
      data,
    });
    return { success: true, data: updated };
  }

  /** Elimina una dirección del propio cliente. Si era la predeterminada,
   *  otra pasa a serlo. */
  async deleteAddress(customerId: number, id: number) {
    const existing = await this.prisma.customerAddress.findFirst({
      where: { id, customerId },
    });
    if (!existing) throw new NotFoundException('Dirección no encontrada.');

    await this.prisma.customerAddress.delete({ where: { id } });

    if (existing.isDefault) {
      const next = await this.prisma.customerAddress.findFirst({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
      });
      if (next) {
        await this.prisma.customerAddress.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }
    return { success: true };
  }

  // Busqueda de productos
  async searchProducts(term: string, website: WebsiteContext) {
    const { localId } = website;

    const normalizedTerm = term
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    const products = await this.prisma.$queryRaw<any[]>`
      SELECT DISTINCT i.*
      FROM "Inventory" i
      WHERE
        i."localId" = ${localId}
        AND i."status" = 'ACTIVO'
        AND translate(
              lower(i."name"),
              'áéíóúÁÉÍÓÚñÑ',
              'aeiouAEIOUnN'
            ) LIKE '%' || ${normalizedTerm} || '%'
      ORDER BY i."createdAt" DESC
      LIMIT 20
    `;

    const fullProducts = await this.prisma.inventory.findMany({
      where: {
        id: { in: products.map((p) => p.id) },
      },
      include: {
        category: true,
        brand: true,
        images: { orderBy: { position: 'asc' } },
        variants: true,
        features: { orderBy: { order: 'asc' } },
        specifications: { orderBy: { order: 'asc' } },
      },
    });

    const data = fullProducts.map((product) => {
      const colors = product.variants
        .filter((v) => product.trackStock === false || v.stock > 0)
        .map((v) => ({
          variantId: v.id,
          name: v.color,
          size: v.size,
          stock: v.stock,
        }));

      const { price, oldPrice, discount } = this.priceInfo(product);

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price,
          unit: product.unit ?? 'UNIDAD',
          trackStock: product.trackStock,
        oldPrice,
        discount,
        colors,
        brand: product.brand?.name ?? null,
        image: product.images[0]?.url ?? null,
        images: product.images.map((img) => img.url),
        category: product.category
          ? product.category.name
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/\s+/g, '-')
          : null,
      };
    });

    return { success: true, data };
  }

  // Imprime novedades
  async getNewProducts(limit = 10, website: WebsiteContext) {
    const { localId } = website;

    const products = await this.prisma.inventory.findMany({
      where: {
        localId,
        status: 'ACTIVO',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: true,
        brand: true,
        category: true,
      },
    });

    return {
      success: true,
      data: products.map((product) => {
        const stock = product.variants.reduce((s, v) => s + v.stock, 0);

        const colors = product.variants
          .filter((v) => product.trackStock === false || v.stock > 0)
          .map((v) => ({ variantId: v.id, name: v.color, size: v.size, stock: v.stock }));

        const { price, oldPrice, discount } = this.priceInfo(product);

        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price,
          unit: product.unit ?? 'UNIDAD',
          trackStock: product.trackStock,
          oldPrice,
          discount,
          stock,
          colors,
          brand: product.brand?.name ?? null,
          category: product.category?.name ?? null,
          image: product.images[0]?.url ?? null,
          images: product.images.map((img) => img.url),
        };
      }),
    };
  }

  // Imprime ofertas
  async getOffers(limit = 10, website: WebsiteContext) {
    const { localId } = website;

    const products = await this.prisma.inventory.findMany({
      where: {
        localId,
        status: 'ACTIVO',
        oldPrice: { not: null },
        salePrice: { lt: this.prisma.inventory.fields.oldPrice },
      },
      orderBy: {
        oldPrice: 'desc',
      },
      take: limit,
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: true,
        brand: true,
        category: true,
      },
    });

    return {
      success: true,
      data: products.map((product) => {
        const { price, oldPrice, discount } = this.priceInfo(product);

        const stock = product.variants.reduce((s, v) => s + v.stock, 0);
        const colors = product.variants
          .filter((v) => product.trackStock === false || v.stock > 0)
          .map((v) => ({ variantId: v.id, name: v.color, size: v.size, stock: v.stock }));

        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price,
          unit: product.unit ?? 'UNIDAD',
          trackStock: product.trackStock,
          oldPrice,
          discount,
          stock,
          colors,
          brand: product.brand?.name ?? null,
          category: product.category?.name ?? null,
          image: product.images[0]?.url ?? null,
          images: product.images.map((img) => img.url),
        };
      }),
    };
  }

  // Imprime los MÁS VENDIDOS (por unidades vendidas). Si no hay ventas
  // suficientes, completa con los demás productos activos para que la sección
  // siempre tenga contenido.
  async getBestSellers(limit = 10, website: WebsiteContext) {
    const { localId } = website;

    const products = await this.prisma.inventory.findMany({
      where: { localId, status: 'ACTIVO' },
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: true,
        brand: true,
        category: true,
      },
    });

    if (products.length === 0) return { success: true, data: [] };

    // Unidades vendidas por variante (solo de este catálogo).
    const variantIds = products.flatMap((p) => p.variants.map((v) => v.id));
    const grouped = variantIds.length
      ? await this.prisma.saleItem.groupBy({
          by: ['inventoryVariantId'],
          _sum: { quantity: true },
          where: { inventoryVariantId: { in: variantIds } },
        })
      : [];

    const soldByVariant = new Map<number, number>();
    for (const g of grouped) {
      if (g.inventoryVariantId != null) {
        soldByVariant.set(g.inventoryVariantId, g._sum.quantity ?? 0);
      }
    }

    const withSold = products.map((product) => {
      const sold = product.variants.reduce(
        (s, v) => s + (soldByVariant.get(v.id) ?? 0),
        0,
      );
      return { product, sold };
    });

    // Más vendidos primero; a igualdad, lo más nuevo.
    withSold.sort((a, b) => {
      if (b.sold !== a.sold) return b.sold - a.sold;
      return (
        new Date(b.product.createdAt).getTime() -
        new Date(a.product.createdAt).getTime()
      );
    });

    return {
      success: true,
      data: withSold.slice(0, limit).map(({ product, sold }) => {
        const { price, oldPrice, discount } = this.priceInfo(product);

        const stock = product.variants.reduce((s, v) => s + v.stock, 0);
        const colors = product.variants
          .filter((v) => product.trackStock === false || v.stock > 0)
          .map((v) => ({
            variantId: v.id,
            name: v.color,
            size: v.size,
            stock: v.stock,
          }));

        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price,
          unit: product.unit ?? 'UNIDAD',
          trackStock: product.trackStock,
          oldPrice,
          discount,
          stock,
          sold: Math.round(sold),
          colors,
          brand: product.brand?.name ?? null,
          category: product.category?.name ?? null,
          image: product.images[0]?.url ?? null,
          images: product.images.map((img) => img.url),
        };
      }),
    };
  }

  // Imprime productos por (categorias-novedades-filtros) y filtros
  async getProductsCatalog(
    options: {
      categorySlug?: string;
      mode?: 'category' | 'new' | 'offers';
      colors?: string;
      brands?: string;
      minPrice?: string;
      maxPrice?: string;
      sort?: string;
    },
    website: WebsiteContext,
  ) {
    const {
      categorySlug,
      mode = 'category',
      colors,
      brands,
      minPrice,
      maxPrice,
      sort,
    } = options;
    const { localId } = website;

    let orderBy: any = { createdAt: 'desc' };

    switch (sort) {
      case 'price_asc':
        orderBy = { salePrice: 'asc' };
        break;
      case 'price_desc':
        orderBy = { salePrice: 'desc' };
        break;
      case 'name_asc':
        orderBy = { name: 'asc' };
        break;
      case 'name_desc':
        orderBy = { name: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
    }

    /** WHERE BASE */
    const where: any = {
      localId: localId,
      status: 'ACTIVO',
      salePrice: {
        gte: minPrice ? Number(minPrice) : undefined,
        lte: maxPrice ? Number(maxPrice) : undefined,
      },
    };

    /** CATEGORY */
    let categoryInfo: { name: string; description: string | null } | null = null;

    if (mode === 'category' && categorySlug) {
      // El slug de la URL se compara contra el slug del nombre de la categoría.
      // (Antes se hacía `replace('-', ' ')`, que solo cambia el PRIMER guion y
      // dejaba sin productos a toda categoría de tres o más palabras.)
      const categories = await this.prisma.category.findMany({
        where: { localId, status: 'ACTIVO' },
        select: { id: true, name: true, description: true },
      });

      const target = this.slugify(categorySlug);

      const category = categories.find(
        (item) => this.slugify(item.name) === target,
      );

      if (category) {
        categoryInfo = {
          name: category.name,
          description: category.description ?? null,
        };
      }

      if (!category) {
        return {
          success: true,
          total: 0,
          data: [],
          filters: {
            colors: [],
            brands: [],
            price: { min: 0, max: 0 },
            sort: SORT_OPTIONS,
          },
        };
      }

      where.categoryId = category.id;
    }

    /** NOVEDADES: los más recientes. Antes se filtraba por "creados en los
     * últimos 30 días", pero si la tienda no cargó productos hace poco la página
     * quedaba vacía. Ahora se muestran los más nuevos (orden por fecha) con un
     * tope, así siempre hay contenido y es consistente con la sección del home. */
    let take: number | undefined;
    if (mode === 'new') {
      take = 30;
      if (!sort) orderBy = { createdAt: 'desc' };
    }

    /** OFERTAS */
    if (mode === 'offers') {
      where.oldPrice = { not: null };
      where.salePrice = { lt: this.prisma.inventory.fields.oldPrice };
    }

    /** FILTROS */
    if (brands) {
      where.brand = {
        name: {
          in: brands.split(','),
          mode: 'insensitive',
        },
      };
    }

    if (colors) {
      where.variants = {
        some: {
          color: {
            in: colors.split(','),
            mode: 'insensitive',
          },
          stock: { gt: 0 },
        },
      };
    }

    const products = await this.prisma.inventory.findMany({
      where,
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: true,
        brand: true,
        category: true,
      },
      orderBy,
      ...(take ? { take } : {}),
    });

    /** ====== FILTROS DINÁMICOS ====== */
    const colorMap = new Map<string, number>();
    const brandMap = new Map<string, number>();
    let minPriceFound = Infinity;
    let maxPriceFound = 0;

    const data = products.map((product) => {
      product.variants.forEach((v) => {
        if (v.stock > 0) {
          colorMap.set(v.color, (colorMap.get(v.color) || 0) + v.stock);
        }
      });

      if (product.brand?.name) {
        brandMap.set(
          product.brand.name,
          (brandMap.get(product.brand.name) || 0) + 1,
        );
      }

      const { price, oldPrice, discount } = this.priceInfo(product);

      minPriceFound = Math.min(minPriceFound, price);
      maxPriceFound = Math.max(maxPriceFound, price);

      const colors = product.variants
        .filter((v) => product.trackStock === false || v.stock > 0)
        .map((v) => ({ variantId: v.id, name: v.color, size: v.size, stock: v.stock }));

      const stock = colors.reduce((s, c) => s + c.stock, 0);

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price,
          unit: product.unit ?? 'UNIDAD',
          trackStock: product.trackStock,
        oldPrice,
        discount,
        stock,
        colors,
        brand: product.brand?.name ?? null,
        category: product.category?.name ?? null,
        image: product.images[0]?.url ?? null,
        images: product.images.map((img) => img.url),
      };
    });

    const filters = {
      colors: Array.from(colorMap.entries()).map(([name, count]) => ({
        label: name.charAt(0).toUpperCase() + name.slice(1),
        value: name.toLowerCase(),
        count,
      })),
      brands: Array.from(brandMap.entries()).map(([name, count]) => ({
        label: name,
        value: name.toLowerCase(),
        count,
      })),
      price: {
        min: isFinite(minPriceFound) ? minPriceFound : 0,
        max: maxPriceFound,
      },
      sort: SORT_OPTIONS,
    };

    return {
      success: true,
      total: data.length,
      data,
      filters,
      category: categoryInfo,
    };
  }

  // Imprime producto por slug
  async getProductBySlug(slug: string, website: WebsiteContext) {
    const { localId } = website;

    const product = await this.prisma.inventory.findFirst({
      where: {
        slug,
        localId: localId,
        status: 'ACTIVO',
      },
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: true,
        // En la tienda solo se muestran las características/especificaciones
        // marcadas como visibles (se pueden ocultar sin borrarlas).
        features: { where: { visible: true }, orderBy: { order: 'asc' } },
        specifications: { where: { visible: true }, orderBy: { order: 'asc' } },
      },
    });

    if (!product) {
      return { success: false, data: null };
    }

    const colors = product.variants.map((v) => ({
      variantId: v.id,
      name: v.color,
          size: v.size,
      stock: v.stock,
    }));

    const { price, oldPrice, discount } = this.priceInfo(product);

    return {
      success: true,
      data: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price,
          unit: product.unit ?? 'UNIDAD',
          trackStock: product.trackStock,
        oldPrice,
        discount,
        images: product.images.map((i) => i.url),
        colors,
        features: product.features,
        specifications: product.specifications,
      },
    };
  }

  // Productos relacionados
  async getRelatedProducts(slug: string, limit = 8, website: WebsiteContext) {
    const { localId } = website;

    // 1. Producto base
    const baseProduct = await this.prisma.inventory.findFirst({
      where: {
        slug,
        localId: localId,
        status: 'ACTIVO',
      },
      select: {
        id: true,
        categoryId: true,
        brandId: true,
      },
    });

    if (!baseProduct) {
      return { success: false, data: [] };
    }

    const orConditions: any[] = [];

    if (baseProduct.categoryId) {
      orConditions.push({ categoryId: baseProduct.categoryId });
    }

    if (baseProduct.brandId) {
      orConditions.push({ brandId: baseProduct.brandId });
    }

    if (orConditions.length === 0) {
      return { success: true, data: [] };
    }

    // 3. Query relacionados
    const products = await this.prisma.inventory.findMany({
      where: {
        localId: localId,
        status: 'ACTIVO',
        id: { not: baseProduct.id },
        OR: orConditions,
      },
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: true,
        brand: true,
        category: true,
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 4. Formatear respuesta
    const data = products.map((product) => {
      const stock = product.variants.reduce((sum, v) => sum + v.stock, 0);

      const colors = product.variants
        .filter((v) => product.trackStock === false || v.stock > 0)
        .map((v) => ({ variantId: v.id, name: v.color, size: v.size, stock: v.stock }));

      const { price, oldPrice, discount } = this.priceInfo(product);

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price,
          unit: product.unit ?? 'UNIDAD',
          trackStock: product.trackStock,
        oldPrice,
        discount,
        stock,
        colors,
        brand: product.brand?.name ?? null,
        category: product.category?.name ?? null,
        image: product.images[0]?.url ?? null,
        images: product.images.map((img) => img.url),
      };
    });

    return {
      success: true,
      data,
    };
  }

  async getProductsForSitemap(website: WebsiteContext) {
    const { localId } = website;

    const products = await this.prisma.inventory.findMany({
      where: {
        status: 'ACTIVO',
        localId: localId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        slug: true,
        updatedAt: true,
        category: {
          select: { name: true },
        },
      },
    });

    return products.map((p) => ({
      slug: p.slug,
      category: p.category?.name
        ?.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-'),
      updatedAt: p.updatedAt,
    }));
  }

  /* CHECKOUT ECOMMERCE */

  /**
   * Prefijo del código de pedido a partir del nombre de la empresa
   * (cada tienda es de un negocio distinto, no puede ir fijo).
   */
  private buildOrderPrefix(companyName?: string | null) {
    const letters = (companyName || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z]/g, '');

    return letters.slice(0, 3) || 'WEB';
  }

  // Consulta pública del estado de un pedido para el CLIENTE. Seguro: exige DOS
  // datos que coincidan en el MISMO pedido — número de pedido o guía + la cédula
  // — y está escopado a la empresa del dominio. No expone pedidos con pago en
  // línea sin confirmar. No revela qué dato falló (mensaje genérico).
  async trackOrder(website: WebsiteContext, ref?: string, document?: string) {
    const r = (ref || '').trim();
    const doc = (document || '').replace(/\D/g, '').trim();

    if (!r || !doc) {
      throw new BadRequestException(
        'Ingresa el número de pedido (o guía) y tu número de cédula.',
      );
    }

    const sale = await this.prisma.sale.findFirst({
      where: {
        source: 'ECOMMERCE',
        local: { is: { companyId: website.companyId } },
        // Nunca mostrar pedidos con pago en línea sin confirmar.
        paymentStatus: { not: 'EN_VALIDACION' as any },
        ecommerceCustomer: { is: { documentNumber: doc } },
        OR: [{ code: r }, { shipment: { is: { trackingNumber: r } } }],
      },
      include: {
        items: {
          include: { variant: { include: { inventory: true } } },
        },
        shipment: true,
        ecommerceCustomer: {
          select: {
            firstName: true,
            lastName: true,
            address: true,
            neighborhood: true,
            city: true,
            department: true,
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(
        'No encontramos un pedido con esos datos. Verifica el número de pedido/guía y tu cédula.',
      );
    }

    // Desglose de valores para el cliente: subtotal + envío = total.
    const subtotal =
      sale.subtotal != null ? Number(sale.subtotal) : null;
    const total = Number(sale.totalAmount) || 0;
    const shippingCost = subtotal != null ? Math.max(total - subtotal, 0) : null;

    // Método y estado de pago en texto claro.
    const paymentMethodLabel =
      sale.paymentMethod === 'EFECTIVO'
        ? 'Contra entrega'
        : sale.paymentMethod === 'TRANSFERENCIA'
          ? 'Pago en línea'
          : sale.paymentMethod;
    const paid = sale.paymentStatus === 'PAGADA';
    const paymentStatusLabel = paid
      ? 'Pagado'
      : sale.paymentMethod === 'EFECTIVO'
        ? 'Pagas al recibir'
        : 'Pendiente de pago';
    // Cuánto debe pagar: contra entrega no pagado → el total al recibir; si ya
    // pagó en línea → 0.
    const amountToPay =
      sale.paymentMethod === 'EFECTIVO' && !paid ? total : 0;

    // Tipo de entrega (se guardó en las notas del pedido como "Entrega: X").
    let deliveryType: string | null = null;
    const m = /Entrega:\s*([^·]+)/.exec(sale.notes || '');
    if (m) deliveryType = m[1].trim();

    return {
      success: true,
      data: {
        code: sale.code,
        customerName: `${sale.ecommerceCustomer?.firstName || ''} ${
          sale.ecommerceCustomer?.lastName || ''
        }`.trim(),
        saleStatus: sale.saleStatus,
        shippingStatus: sale.shippingStatus,
        paymentStatus: sale.paymentStatus,
        paymentMethod: sale.paymentMethod,
        paymentMethodLabel,
        paymentStatusLabel,
        paid,
        deliveryType,
        subtotal,
        shippingCost,
        total,
        amountToPay,
        createdAt: sale.saleDate,
        address: [
          sale.ecommerceCustomer?.address,
          sale.ecommerceCustomer?.neighborhood,
          sale.ecommerceCustomer?.city,
          sale.ecommerceCustomer?.department,
        ]
          .filter(Boolean)
          .join(', '),
        carrier: sale.shipment?.carrier || null,
        trackingNumber: sale.shipment?.trackingNumber || null,
        shippedAt: sale.shipment?.shippedAt || null,
        deliveredAt: sale.shipment?.deliveredAt || null,
        items: sale.items.map((i) => ({
          name: i.variant?.inventory?.name || 'Producto',
          quantity: i.quantity,
        })),
      },
    };
  }

  async createOrder(
    dto: CreateEcommerceOrderDto,
    website: WebsiteContext,
    loggedCustomerId: number | null = null,
  ) {
    const { localId } = website;
    const isOnlinePayment = dto.paymentMethod === 'TRANSFERENCIA';

    const result = await this.prisma.$transaction(async (tx) => {
      /**  CLIENTE ECOMMERCE (perfil de envío/facturación) */
      let ecommerceCustomer = await tx.ecommerceCustomer.findUnique({
        where: { email: dto.customer.email },
      });

      if (!ecommerceCustomer) {
        ecommerceCustomer = await tx.ecommerceCustomer.create({
          data: {
            email: dto.customer.email,
            firstName: dto.customer.firstName,
            lastName: dto.customer.lastName,
            phone: dto.customer.phone,
            documentNumber: dto.customer.documentNumber,
            // En recoger en tienda / mesa no hay dirección: se guarda vacío.
            department: dto.customer.department ?? '',
            city: dto.customer.city ?? '',
            address: dto.customer.address ?? '',
            addressDetail: dto.customer.addressDetail,
            neighborhood: dto.customer.neighborhood,
            billingSameAsShipping: dto.customer.billingSameAsShipping ?? true,
            billingFirstName: dto.customer.billingFirstName,
            billingLastName: dto.customer.billingLastName,
            billingPhone: dto.customer.billingPhone,
            billingAddress: dto.customer.billingAddress,
            isHardToAccess: dto.customer.isHardToAccess ?? false,
            localId: localId,
            customerId: loggedCustomerId ?? undefined,
          },
        });
      } else if (loggedCustomerId && !ecommerceCustomer.customerId) {
        // Enlaza el perfil de tienda al cliente del CRM cuando inicia sesión.
        ecommerceCustomer = await tx.ecommerceCustomer.update({
          where: { id: ecommerceCustomer.id },
          data: { customerId: loggedCustomerId },
        });
      }

      /** =========================
     * VALIDAR ITEMS + STOCK
     ========================== */
      // Pago en línea (Wompi): NO se descuenta stock aquí; solo se valida
      // disponibilidad. El stock se descuenta cuando el webhook confirma el pago
      // (APPROVED). Así, si el cliente no paga, no se pierde inventario ni el
      // pedido aparece en el CRM. Contra entrega (EFECTIVO) sí descuenta ya.
      const isOnline = dto.paymentMethod === 'TRANSFERENCIA';
      let total = 0;
      const itemsData: any[] = [];

      for (const item of dto.items) {
        const variant = await tx.inventoryVariant.findFirst({
          where: {
            id: item.inventoryVariantId,
            inventory: {
              localId: website.localId,
              status: 'ACTIVO',
            },
          },
          include: {
            inventory: true,
          },
        });

        // Son errores del comprador (producto retirado o sin stock), no fallos
        // del servidor: se devuelven como 400 para que la tienda los muestre.
        if (!variant) {
          throw new BadRequestException(
            'Uno de los productos ya no está disponible. Actualiza tu carrito.',
          );
        }

        // Los "elaborados" (platos de un menú) no controlan stock: se pueden
        // pedir siempre y no se validan ni descuentan existencias.
        const tracksStock = variant.inventory.trackStock !== false;

        if (tracksStock && variant.stock < item.quantity) {
          throw new BadRequestException(
            `Stock insuficiente para ${variant.inventory.name} (${variant.color}). Quedan ${variant.stock}.`,
          );
        }

        // La tienda online cobra el PRECIO ONLINE (onlinePrice); si no está
        // definido, cae al salePrice. El salePrice es el de la tienda física.
        const price =
          variant.inventory.onlinePrice != null
            ? variant.inventory.onlinePrice
            : variant.inventory.salePrice;
        const subtotal = price * item.quantity;
        total += subtotal;

        // Descontar stock de forma ATÓMICA (solo si controla inventario y NO es
        // pago en línea): el UPDATE solo aplica si aún hay existencias. Así, si el
        // POS u otro comprador tomó la última unidad entre la validación y aquí,
        // este pedido falla en vez de dejar el stock negativo (sin sobreventa).
        // En pago en línea el descuento ocurre al confirmar el pago (webhook).
        if (tracksStock && !isOnline) {
          const decremented = await tx.inventoryVariant.updateMany({
            where: { id: variant.id, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (decremented.count === 0) {
            throw new BadRequestException(
              `Stock insuficiente para ${variant.inventory.name} (${variant.color}). Se agotó mientras comprabas.`,
            );
          }
        }

        itemsData.push({
          inventoryVariantId: variant.id,
          quantity: item.quantity,
          price,
          subtotal,
        });
      }

      // Subtotal (solo productos) antes de sumar el envío: se guarda para poder
      // mostrarle al cliente el desglose (subtotal + envío = total) al consultar.
      const itemsSubtotal = total;

      // Envío. Si la tienda tiene TRANSPORTADORAS configuradas, el BACKEND
      // recalcula el costo según destino + transportadora (fuente de verdad, no
      // se confía en el front). Si NO tiene transportadoras (tiendas ya activas),
      // se conserva el comportamiento actual (el costo lo calcula el front).
      const storeShipping = (website.company as any)?.storeShipping || null;
      const hasCarriers =
        Array.isArray(storeShipping?.carriers) &&
        storeShipping.carriers.some((c: any) => c && c.enabled !== false);
      let shippingCost = 0;
      let chosenCarrierName: string | null = null;
      let chosenDays: string | null = null;
      if (!isNoChargeMode(dto.deliveryMethod)) {
        // Las transportadoras aplican SOLO al envío nacional. El domicilio local
        // usa la tarifa plana del dueño (se confía en el front, es un valor bajo
        // que el dueño define).
        if (dto.deliveryMethod === 'shipping' && hasCarriers) {
          const options = quoteShipping(
            storeShipping,
            dto.customer.department,
            itemsSubtotal,
            dto.carrierId,
          );
          const chosen = pickOption(options, dto.carrierId);
          if (chosen) {
            shippingCost = chosen.cost;
            chosenCarrierName = chosen.name;
            chosenDays = chosen.days;
          }
        } else {
          shippingCost = Math.max(0, Number(dto.shippingCost) || 0);
        }
      }
      total += shippingCost;

      /** ACTORES DEL CHECKOUT (se crean/resuelven si la empresa no los tenía) */
      // Si el cliente inició sesión, el pedido queda a SU nombre. Si NO inició
      // sesión pero el correo coincide con un cliente registrado de la empresa,
      // también queda a su nombre (no como "Consumidor Final"). En último caso,
      // cae en "Consumidor Final".
      let crmCustomerId = loggedCustomerId;
      if (!crmCustomerId && dto.customer?.email) {
        const match = await tx.customer.findFirst({
          where: {
            companyId: website.companyId,
            email: { equals: dto.customer.email.trim(), mode: 'insensitive' },
          },
          select: { id: true },
        });
        if (match) crmCustomerId = match.id;
      }
      crmCustomerId = crmCustomerId || website.customerId;
      if (!crmCustomerId) {
        const cf = await tx.customer.upsert({
          where: {
            document_companyId: {
              document: '222222222222',
              companyId: website.companyId,
            },
          },
          update: {},
          create: {
            document: '222222222222',
            name: 'CONSUMIDOR FINAL',
            companyId: website.companyId,
          },
          select: { id: true },
        });
        crmCustomerId = cf.id;
      }

      let systemUserId = website.systemUserId;
      if (!systemUserId) {
        const su =
          (await tx.user.findFirst({
            where: {
              companyId: website.companyId,
              status: 'ACTIVO',
              role: 'SUPER_ADMIN',
            },
            select: { id: true },
          })) ||
          (await tx.user.findFirst({
            where: { companyId: website.companyId, status: 'ACTIVO' },
            select: { id: true },
          }));
        if (!su) {
          throw new BadRequestException(
            'La tienda no está lista para recibir pedidos. Contacta al administrador.',
          );
        }
        systemUserId = su.id;
      }

      // Nota del pedido con el modo de entrega + notas del cliente (visible en
      // el detalle de Pedidos del CRM).
      const METHOD_LABEL: Record<string, string> = {
        shipping: 'Envío a domicilio',
        local_delivery: 'Domicilio local',
        pickup: 'Recoger en tienda',
        dine_in: 'Consumo en el lugar',
      };
      const noteParts: string[] = [];
      const methodLabel = dto.deliveryMethod
        ? METHOD_LABEL[dto.deliveryMethod]
        : null;
      if (methodLabel) noteParts.push(`Entrega: ${methodLabel}`);
      if (chosenCarrierName) noteParts.push(`Transportadora: ${chosenCarrierName}`);
      if (chosenDays) noteParts.push(`Tiempo estimado: ${chosenDays}`);
      if (dto.notes?.trim()) noteParts.push(dto.notes.trim());
      const saleNotes = noteParts.length ? noteParts.join(' · ') : null;

      /** CREAR VENTA (SALE) */
      const sale = await tx.sale.create({
        data: {
          code: `${this.buildOrderPrefix(website.company?.name)}-${Date.now()}`,
          totalAmount: total,
          subtotal: itemsSubtotal,
          notes: saleNotes,

          paymentMethod: dto.paymentMethod,
          // Online: queda EN_VALIDACION y en estado PENDIENTE (oculto del CRM)
          // hasta que el webhook confirme el pago. Contra entrega: PENDIENTE de
          // cobro pero visible como pedido NUEVO para gestionarlo.
          paymentStatus: isOnline ? 'EN_VALIDACION' : 'PENDIENTE',
          saleStatus: isOnline ? 'PENDIENTE' : 'NUEVA',
          source: 'ECOMMERCE',

          customerId: crmCustomerId,
          ecommerceCustomerId: ecommerceCustomer.id,

          localId: localId,
          userId: systemUserId,

          wompiTransactionId: dto.wompiTransactionId ?? null,
          wompiReference: dto.wompiReference ?? null,
          wompiPayload: dto.wompiPayload ?? null,

          items: {
            create: itemsData,
          },
        },
      });

      /** CREAR ENVÍO (con la transportadora elegida por el cliente, si aplica) */
      await tx.shipment.create({
        data: {
          saleId: sale.id,
          status: 'PENDIENTE',
          ...(chosenCarrierName && { carrier: chosenCarrierName }),
        },
      });

      return {
        success: true,
        orderCode: sale.code,
        saleId: sale.id,
        paymentMethod: dto.paymentMethod,
      };
    });

    // Contra entrega (EFECTIVO): el pedido ya está confirmado y visible, así que
    // le enviamos al cliente el correo de confirmación de una vez. (En pago en
    // línea el correo lo manda el webhook cuando el pago queda APROBADO.)
    if (!isOnlinePayment && result?.saleId) {
      this.sendCodConfirmation(result.saleId, website.companyId).catch(() => {
        /* el fallo de correo no debe afectar la creación del pedido */
      });
    }

    return result;
  }

  // Correo de confirmación para pedidos CONTRA ENTREGA (pago al recibir).
  private async sendCodConfirmation(saleId: number, companyId: number) {
    const sale: any = await this.prisma.sale.findUnique({
      where: { id: saleId },
      select: {
        code: true,
        subtotal: true,
        totalAmount: true,
        notes: true,
        shipment: { select: { carrier: true } },
        ecommerceCustomer: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            address: true,
            neighborhood: true,
            city: true,
            department: true,
          },
        },
        items: {
          select: {
            quantity: true,
            price: true,
            variant: { select: { inventory: { select: { name: true } } } },
          },
        },
      },
    });
    const to = sale?.ecommerceCustomer?.email;
    if (!to) return;

    const company: any = await this.prisma.company.findUnique({
      where: { id: companyId },
      omit: { mailPassword: false },
    });
    if (!company) return;

    const smtp = company.mailHost
      ? {
          host: company.mailHost,
          port: company.mailPort,
          user: company.mailUser,
          pass: company.mailPassword,
          fromEmail: company.mailFromEmail,
          fromName: company.mailFromName || company.name,
        }
      : undefined;

    const subtotal = sale.subtotal != null ? Number(sale.subtotal) : null;
    const total = Number(sale.totalAmount) || 0;
    const shippingCost = subtotal != null ? Math.max(total - subtotal, 0) : null;
    const ec = sale.ecommerceCustomer;
    const address = [ec?.address, ec?.neighborhood, ec?.city, ec?.department]
      .filter(Boolean)
      .join(', ');
    const deliveryMatch = /Entrega:\s*([^·]+)/.exec(sale.notes || '');
    const timeMatch = /Tiempo estimado:\s*([^·]+)/.exec(sale.notes || '');

    await this.mail
      .sendOrderConfirmation({
        to,
        companyName: company.mailFromName || company.name || 'Tienda',
        smtp,
        brandColor: company.primaryColor,
        logo: company.logo || null,
        trackUrl: company.domain
          ? `https://${company.domain}/?pedido=${encodeURIComponent(sale.code)}`
          : null,
        replyTo: company.email || company.mailFromEmail || null,
        supportEmail: company.email || company.mailFromEmail || null,
        supportPhone: company.phone || null,
        order: {
          code: sale.code,
          items: (sale.items || []).map((it: any) => ({
            name: it.variant?.inventory?.name || 'Producto',
            quantity: it.quantity,
            price: Number(it.price) || 0,
          })),
          subtotal,
          shippingCost,
          total,
          address: address || null,
          customerName: `${ec?.firstName || ''} ${ec?.lastName || ''}`.trim(),
          paymentLabel: 'Contra entrega',
          deliveryLabel: deliveryMatch ? deliveryMatch[1].trim() : null,
          carrier: sale.shipment?.carrier || null,
          estimatedTime: timeMatch ? timeMatch[1].trim() : null,
          // En contra entrega el cliente paga el total al recibir.
          amountToPay: total,
        },
      })
      .catch(() => undefined);
  }
}
