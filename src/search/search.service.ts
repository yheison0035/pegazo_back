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
      return { term: '', products: [], customers: [] };
    }

    const [products, customers] = await Promise.all([
      this.searchProducts(user, term),
      this.searchCustomers(user, term),
    ]);

    return { term, products, customers };
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

  private async searchCustomers(user: any, term: string) {
    const items = await this.prisma.customer.findMany({
      where: {
        companyId: user.companyId,
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { phone: { contains: term, mode: 'insensitive' } },
          { document: { contains: term, mode: 'insensitive' } },
        ],
      },
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
