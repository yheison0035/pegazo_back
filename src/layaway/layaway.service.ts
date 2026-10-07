import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { SalesService } from '@/sales/sales.service';

// PLAN SEPARE (apartado / layaway): el cliente abona hasta completar el total;
// NO se descuenta stock ni se entrega hasta pagar. Al completar, se genera la
// venta real (descuenta stock, aparece en reportes) SIN volver a cobrar en caja
// (el dinero ya entró vía abonos → la venta se crea con `skipCash`). Se pueden
// editar los productos mientras esté ACTIVO.
@Injectable()
export class LayawayService {
  constructor(
    private prisma: PrismaService,
    private sales: SalesService,
  ) {}

  private num(v: any) {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  private async defaultLocalId(companyId: number) {
    const l = await this.prisma.local.findFirst({
      where: { companyId },
      orderBy: { id: 'asc' },
      select: { id: true },
    });
    return l?.id ?? null;
  }

  // Resuelve los ítems: valida que la variante sea de la empresa, congela el
  // precio (el enviado o el de venta actual) y calcula el subtotal.
  private async buildItems(
    companyId: number,
    rawItems: any[],
  ): Promise<{ inventoryVariantId: number; quantity: number; price: number; subtotal: number }[]> {
    const list = Array.isArray(rawItems) ? rawItems : [];
    if (!list.length)
      throw new BadRequestException('Agrega al menos un producto.');
    const out: any[] = [];
    for (const it of list) {
      const variantId = Number(it.inventoryVariantId);
      const quantity = this.num(it.quantity);
      if (!variantId || quantity <= 0)
        throw new BadRequestException('Producto o cantidad no válidos.');
      const variant = await this.prisma.inventoryVariant.findFirst({
        where: {
          id: variantId,
          inventory: { local: { companyId } },
        },
        include: { inventory: { select: { salePrice: true } } },
      });
      if (!variant) throw new BadRequestException('Producto no válido.');
      const price =
        it.price != null && this.num(it.price) > 0
          ? this.num(it.price)
          : variant.inventory.salePrice;
      out.push({
        inventoryVariantId: variantId,
        quantity,
        price,
        subtotal: Math.round(price * quantity),
      });
    }
    return out;
  }

  private async code(companyId: number) {
    const count = await this.prisma.layaway.count({ where: { companyId } });
    return `PS-${companyId}-${count + 1}`;
  }

  // Registra un abono en la tabla + (si es efectivo y hay caja abierta) en la
  // caja de la sede, para que el arqueo cuadre.
  private async registerPayment(
    tx: any,
    user: any,
    layaway: { id: number; localId: number },
    amount: number,
    method: string,
    note?: string,
  ) {
    await tx.layawayPayment.create({
      data: {
        layawayId: layaway.id,
        amount,
        method: (method as any) || 'EFECTIVO',
        note: note?.trim() || null,
        createdById: user.id,
      },
    });
    if ((method || 'EFECTIVO') === 'EFECTIVO') {
      const openReg = await tx.cashRegister.findFirst({
        where: {
          localId: layaway.localId,
          companyId: user.companyId,
          status: 'ABIERTA',
        },
        select: { id: true },
      });
      if (openReg) {
        await tx.cashMovement.create({
          data: {
            cashRegisterId: openReg.id,
            type: 'INGRESO',
            amount,
            concept: 'Abono plan separe',
            userId: user.id,
          },
        });
      }
    }
  }

  async create(user: any, dto: any) {
    const items = await this.buildItems(user.companyId, dto.items);
    const total = items.reduce((s, i) => s + i.subtotal, 0);
    const localId = dto.localId
      ? Number(dto.localId)
      : await this.defaultLocalId(user.companyId);
    if (!localId)
      throw new BadRequestException(
        'La empresa no tiene un local/punto de venta.',
      );
    const code = await this.code(user.companyId);

    const created = await this.prisma.$transaction(async (tx) => {
      const lay = await tx.layaway.create({
        data: {
          code,
          companyId: user.companyId,
          localId,
          customerId: dto.customerId ? Number(dto.customerId) : null,
          userId: user.id,
          status: 'ACTIVO',
          totalAmount: total,
          paidAmount: 0,
          notes: dto.notes?.trim() || null,
          items: { create: items },
        },
      });
      // Abono inicial (opcional).
      const initial = this.num(dto.initialPayment?.amount);
      if (initial > 0) {
        const capped = Math.min(initial, total);
        await this.registerPayment(
          tx,
          user,
          { id: lay.id, localId },
          capped,
          dto.initialPayment?.method || 'EFECTIVO',
          'Abono inicial',
        );
        await tx.layaway.update({
          where: { id: lay.id },
          data: { paidAmount: capped },
        });
      }
      return lay;
    });

    return this.detail(user, created.id);
  }

  async addPayment(user: any, id: number, dto: any) {
    const lay = await this.prisma.layaway.findFirst({
      where: { id: Number(id), companyId: user.companyId },
    });
    if (!lay) throw new NotFoundException('Plan separe no encontrado.');
    if (lay.status !== 'ACTIVO')
      throw new BadRequestException('Este plan separe ya no está activo.');

    const remaining = Math.max(0, lay.totalAmount - lay.paidAmount);
    if (remaining <= 0)
      throw new BadRequestException('El plan separe ya está pagado por completo.');
    let amount = this.num(dto.amount);
    if (amount <= 0) throw new BadRequestException('El abono debe ser mayor a 0.');
    amount = Math.min(amount, remaining); // no se permite abonar de más

    await this.prisma.$transaction(async (tx) => {
      await this.registerPayment(
        tx,
        user,
        { id: lay.id, localId: lay.localId },
        amount,
        dto.method || 'EFECTIVO',
        dto.note,
      );
      await tx.layaway.update({
        where: { id: lay.id },
        data: { paidAmount: lay.paidAmount + amount },
      });
    });

    return this.detail(user, lay.id);
  }

  async updateItems(user: any, id: number, dto: any) {
    const lay = await this.prisma.layaway.findFirst({
      where: { id: Number(id), companyId: user.companyId },
    });
    if (!lay) throw new NotFoundException('Plan separe no encontrado.');
    if (lay.status !== 'ACTIVO')
      throw new BadRequestException('Solo se editan planes separe activos.');

    const items = await this.buildItems(user.companyId, dto.items);
    const total = items.reduce((s, i) => s + i.subtotal, 0);

    await this.prisma.$transaction(async (tx) => {
      await tx.layawayItem.deleteMany({ where: { layawayId: lay.id } });
      await tx.layawayItem.createMany({
        data: items.map((i) => ({ ...i, layawayId: lay.id })),
      });
      await tx.layaway.update({
        where: { id: lay.id },
        data: { totalAmount: total },
      });
    });

    return this.detail(user, lay.id);
  }

  // Completar y ENTREGAR: exige estar pagado (o forzar). Genera la venta real
  // (descuenta stock + reportes) con los precios CONGELADOS y sin re-cobrar caja.
  async complete(user: any, id: number, dto: any = {}) {
    const lay = await this.prisma.layaway.findFirst({
      where: { id: Number(id), companyId: user.companyId },
      include: { items: true },
    });
    if (!lay) throw new NotFoundException('Plan separe no encontrado.');
    if (lay.status !== 'ACTIVO')
      throw new BadRequestException('Este plan separe ya no está activo.');
    if (!lay.items.length)
      throw new BadRequestException('El plan separe no tiene productos.');

    const remaining = Math.max(0, lay.totalAmount - lay.paidAmount);
    if (remaining > 0 && !dto.force)
      throw new BadRequestException(
        `Aún falta pagar ${remaining}. No se puede entregar hasta completar el pago.`,
      );

    const saleDto: any = {
      paymentMethod: 'EFECTIVO',
      paymentStatus: 'PAGADA',
      saleStatus: 'ENTREGADA',
      localId: lay.localId,
      userId: lay.userId ?? user.id,
      customerId: lay.customerId ?? undefined,
      notes: `Plan separe ${lay.code}${lay.notes ? ' · ' + lay.notes : ''}`,
      skipCash: true, // el dinero ya entró por abonos
      items: lay.items.map((i) => ({
        inventoryVariantId: i.inventoryVariantId,
        quantity: i.quantity,
        priceOverride: i.price,
      })),
    };

    const res = await this.sales.create(saleDto, user);
    const sale = (res as any)?.data ?? res;

    const updated = await this.prisma.layaway.update({
      where: { id: lay.id },
      data: {
        status: 'COMPLETADO',
        completedAt: new Date(),
        saleId: sale?.id ?? null,
      },
    });

    return { success: true, data: { layaway: updated, sale } };
  }

  async cancel(user: any, id: number) {
    const lay = await this.prisma.layaway.findFirst({
      where: { id: Number(id), companyId: user.companyId },
    });
    if (!lay) throw new NotFoundException('Plan separe no encontrado.');
    if (lay.status !== 'ACTIVO')
      throw new BadRequestException('Este plan separe ya no está activo.');
    // No hay stock que devolver (nunca se descontó). Los abonos ya registrados
    // en caja NO se tocan: la devolución del dinero (si aplica) es un egreso
    // manual que decide el negocio.
    await this.prisma.layaway.update({
      where: { id: lay.id },
      data: { status: 'ANULADO' },
    });
    return { success: true, message: 'Plan separe anulado.' };
  }

  // Enriquecimiento común: nombres de cliente y productos + saldo.
  async detail(user: any, id: number) {
    const lay = await this.prisma.layaway.findFirst({
      where: { id: Number(id), companyId: user.companyId },
      include: {
        items: true,
        payments: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!lay) throw new NotFoundException('Plan separe no encontrado.');
    return { success: true, data: await this.enrich(lay) };
  }

  private async enrich(lay: any) {
    const variantIds = (lay.items || []).map((i: any) => i.inventoryVariantId);
    const variants = variantIds.length
      ? await this.prisma.inventoryVariant.findMany({
          where: { id: { in: variantIds } },
          select: {
            id: true,
            color: true,
            size: true,
            inventory: { select: { name: true } },
          },
        })
      : [];
    const vmap = new Map(variants.map((v) => [v.id, v]));
    const customer = lay.customerId
      ? await this.prisma.customer.findUnique({
          where: { id: lay.customerId },
          select: { name: true, phone: true },
        })
      : null;
    const items = (lay.items || []).map((i: any) => {
      const v = vmap.get(i.inventoryVariantId) as any;
      return {
        ...i,
        name: v?.inventory?.name || 'Producto',
        color: v?.color || null,
        size: v?.size || null,
      };
    });
    return {
      ...lay,
      items,
      customerName: customer?.name || null,
      customerPhone: customer?.phone || null,
      balance: Math.max(0, lay.totalAmount - lay.paidAmount),
    };
  }

  async list(user: any, status = 'ACTIVO') {
    const rows = await this.prisma.layaway.findMany({
      where: { companyId: user.companyId, status },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        payments: { orderBy: { createdAt: 'asc' } },
      },
      take: 200,
    });
    const data = await Promise.all(rows.map((r) => this.enrich(r)));
    const summary = {
      active: data.length,
      totalBalance: data.reduce((s, l) => s + (l.balance || 0), 0),
    };
    return { success: true, data, summary };
  }
}
