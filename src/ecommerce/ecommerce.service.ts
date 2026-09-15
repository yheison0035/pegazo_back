import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { CreateEcommerceOrderDto } from './dto/create-ecommerce-order.dto';
import { PaymentMethod } from '@prisma/client';
import { WebsiteContext } from '@/modules/website/interfaces/website-context.interface';

const SORT_OPTIONS = [
  { label: 'Precio: menor a mayor', value: 'price_asc' },
  { label: 'Precio: mayor a menor', value: 'price_desc' },
  { label: 'A - Z', value: 'name_asc' },
  { label: 'Z - A', value: 'name_desc' },
];

@Injectable()
export class EcommerceService {
  constructor(private readonly prisma: PrismaService) {}

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

    /** NOVEDADES */
    if (mode === 'new') {
      where.createdAt = {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      };
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

    return this.prisma.$transaction(async (tx) => {
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
      // El costo de envío se suma al total (para que coincida con lo cobrado).
      const shippingCost = Number(dto.shippingCost) || 0;
      total += shippingCost;

      /** ACTORES DEL CHECKOUT (se crean/resuelven si la empresa no los tenía) */
      // Si el cliente inició sesión, el pedido queda a SU nombre; si no, cae en
      // "Consumidor Final".
      let crmCustomerId = loggedCustomerId || website.customerId;
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

      /** CREAR ENVÍO */
      await tx.shipment.create({
        data: {
          saleId: sale.id,
          status: 'PENDIENTE',
        },
      });

      return {
        success: true,
        orderCode: sale.code,
        saleId: sale.id,
        paymentMethod: dto.paymentMethod,
      };
    });
  }
}
