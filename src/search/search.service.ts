import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { hasRole } from '@/common/role-check.util';
import { Role } from '@prisma/client';
import { getAccessibleLocalIds } from '@/common/access-locals.util';

// Buscador global (command palette ⌘K). Devuelve, en una sola llamada, los
// productos y clientes de la empresa que coinciden con el término, ya filtrados
// por local accesible y con el precio de compra oculto según el rol. Pensado
// para respuestas rápidas (límites cortos) desde cualquier parte del CRM.
@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async quick(user: any, rawTerm: string) {
    const term = (rawTerm || '').trim();
    if (term.length < 1) {
      return {
        term: '',
        products: [],
        customers: [],
        sales: [],
        services: [],
        providers: [],
        appointments: [],
      };
    }

    const [products, customers, sales, services, providers, appointments] =
      await Promise.all([
        this.searchProducts(user, term),
        this.searchCustomers(user, term),
        this.searchSales(user, term),
        this.searchServices(user, term),
        this.searchProviders(user, term),
        this.searchAppointments(user, term),
      ]);

    return { term, products, customers, sales, services, providers, appointments };
  }

  // Servicios ofrecidos en los locales accesibles (nombre).
  private async searchServices(user: any, term: string) {
    const localIds = await getAccessibleLocalIds(this.prisma, user);
    const where: any = {
      companyId: user.companyId,
      status: { not: 'ELIMINADO' },
      name: { contains: term, mode: 'insensitive' },
    };
    if (localIds !== null) {
      where.serviceLocals =
        localIds.length === 0
          ? { some: { localId: -1 } }
          : { some: { localId: { in: localIds } } };
    }
    const items = await this.prisma.service.findMany({
      where,
      take: 6,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, duration: true },
    });
    return items;
  }

  // Proveedores de la empresa (compartidos entre locales).
  private async searchProviders(user: any, term: string) {
    const items = await this.prisma.provider.findMany({
      where: {
        companyId: user.companyId,
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { docNumber: { contains: term, mode: 'insensitive' } },
          { phone: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: 6,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, docNumber: true, phone: true },
    });
    return items;
  }

  // Citas por cliente/profesional, acotadas al local accesible.
  private async searchAppointments(user: any, term: string) {
    const localIds = await getAccessibleLocalIds(this.prisma, user);
    const where: any = {
      companyId: user.companyId,
      OR: [
        { customer: { is: { name: { contains: term, mode: 'insensitive' } } } },
        { barber: { is: { name: { contains: term, mode: 'insensitive' } } } },
      ],
    };
    if (localIds !== null) {
      where.localId = localIds.length === 0 ? -1 : { in: localIds };
    }
    // El barbero/profesional solo ve SUS citas.
    if (['BARBERO', 'PROFESIONAL'].includes(user.role)) {
      where.barberId = user.id;
    }
    const items = await this.prisma.appointment.findMany({
      where,
      take: 6,
      orderBy: [{ date: 'desc' }],
      select: {
        id: true,
        date: true,
        startTime: true,
        status: true,
        customer: { select: { name: true } },
        service: { select: { name: true } },
        barber: { select: { name: true } },
        local: { select: { name: true } },
      },
    });
    return items.map((a) => ({
      id: a.id,
      date: a.date,
      startTime: a.startTime,
      status: a.status,
      customerName: a.customer?.name || null,
      serviceName: a.service?.name || null,
      barberName: a.barber?.name || null,
      localName: a.local?.name || null,
    }));
  }

  private async searchProducts(user: any, term: string) {
    const localIds = await getAccessibleLocalIds(this.prisma, user);

    const where: any = {
      local: { companyId: user.companyId },
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { barcode: { contains: term, mode: 'insensitive' } },
      ],
    };

    if (localIds !== null) {
      where.localId = localIds.length === 0 ? -1 : { in: localIds };
    }

    const items = await this.prisma.inventory.findMany({
      where,
      take: 8,
      orderBy: { name: 'asc' },
      include: {
        images: { orderBy: { position: 'asc' }, take: 1 },
        variants: { where: { isActive: true }, select: { stock: true } },
        category: { select: { name: true } },
      },
    });

    const canSeePurchasePrice = hasRole(user.role, [
      Role.SUPER_ADMIN,
      Role.ADMIN,
      Role.COORDINADOR,
      Role.AUXILIAR,
    ]);

    return items.map((p) => {
      const stock = p.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        barcode: p.barcode,
        salePrice: p.salePrice,
        oldPrice: p.oldPrice,
        ...(canSeePurchasePrice ? { purchasePrice: p.purchasePrice } : {}),
        stock,
        minStock: p.minStock ?? 0,
        status: p.status,
        image: p.images[0]?.url || null,
        categoryName: p.category?.name || null,
      };
    });
  }

  private async searchSales(user: any, term: string) {
    const localIds = await getAccessibleLocalIds(this.prisma, user);

    const where: any = {
      local: { companyId: user.companyId },
      OR: [
        { code: { contains: term, mode: 'insensitive' } },
        { customer: { name: { contains: term, mode: 'insensitive' } } },
      ],
    };

    if (localIds !== null) {
      where.localId = localIds.length === 0 ? -1 : { in: localIds };
    }

    const items = await this.prisma.sale.findMany({
      where,
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        totalAmount: true,
        saleStatus: true,
        createdAt: true,
        customer: { select: { name: true } },
      },
    });

    return items.map((s) => ({
      id: s.id,
      code: s.code,
      totalAmount: s.totalAmount,
      status: s.saleStatus,
      createdAt: s.createdAt,
      customerName: s.customer?.name || null,
    }));
  }

  private async searchCustomers(user: any, term: string) {
    // Aislamiento por local: el cliente pertenece a su local de registro.
    const localIds = await getAccessibleLocalIds(this.prisma, user);
    const where: any = {
      companyId: user.companyId,
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } },
        { document: { contains: term, mode: 'insensitive' } },
      ],
    };
    if (localIds !== null) {
      where.localId = localIds.length === 0 ? -1 : { in: localIds };
    }
    const items = await this.prisma.customer.findMany({
      where,
      take: 8,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        phone: true,
        document: true,
        city: true,
      },
    });

    return items;
  }
}
