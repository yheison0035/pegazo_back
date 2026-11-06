import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { OpenCashDto, CashMovementDto, CloseCashDto } from './dto/cash.dto';
import {
  getAccessibleLocalIds,
  assertLocalAccess,
} from '@/common/access-locals.util';

// Suma ingresos (ventas en efectivo) y gastos en efectivo del día, y calcula el
// esperado en caja. Los INGRESOS entran por las ventas; las SALIDAS son los
// gastos en efectivo registrados en el módulo Gastos durante el turno. `egresos`
// se mantiene por compatibilidad (movimientos manuales antiguos); las cajas
// nuevas ya no los usan.
function computeTotals(register: any, gastos = 0) {
  const movements = register.movements || [];
  const ingresos = movements
    .filter((m: any) => m.type === 'INGRESO')
    .reduce((s: number, m: any) => s + m.amount, 0);
  const egresos = movements
    .filter((m: any) => m.type === 'EGRESO')
    .reduce((s: number, m: any) => s + m.amount, 0);
  const expected = (register.openingAmount || 0) + ingresos - egresos - gastos;
  return { ingresos, egresos, gastos, expected };
}

@Injectable()
export class CashService {
  constructor(private readonly prisma: PrismaService) {}

  // Caja abierta actual de un local (o null).
  async getCurrent(user: any, localId: number) {
    if (!localId) throw new BadRequestException('localId es obligatorio');
    // Solo el local que el usuario puede ver (el dueño, cualquiera de su empresa).
    await assertLocalAccess(this.prisma, user, localId);

    const base = await this.prisma.cashRegister.findFirst({
      where: { localId, companyId: user.companyId, status: 'ABIERTA' },
    });

    if (!base) return { success: true, data: null };

    // Se auto-reconcilia con las ventas del día antes de mostrarla.
    await this.reconcileCashSales(base);

    const register = await this.prisma.cashRegister.findUnique({
      where: { id: base.id },
      include: {
        movements: { orderBy: { createdAt: 'desc' } },
        openedBy: { select: { id: true, name: true } },
        local: { select: { id: true, name: true } },
      },
    });

    const gastos = await this.sumCashExpenses(base);
    return {
      success: true,
      data: { ...register, totals: computeTotals(register, gastos) },
    };
  }

  async open(user: any, dto: OpenCashDto) {
    await assertLocalAccess(this.prisma, user, dto.localId);

    const existing = await this.prisma.cashRegister.findFirst({
      where: {
        localId: dto.localId,
        companyId: user.companyId,
        status: 'ABIERTA',
      },
    });
    if (existing) {
      throw new BadRequestException(
        'Ya hay una caja abierta en este local. Ciérrala antes de abrir otra.',
      );
    }

    const register = await this.prisma.cashRegister.create({
      data: {
        localId: dto.localId,
        companyId: user.companyId,
        openingAmount: dto.openingAmount ?? 0,
        notes: dto.notes,
        openedById: user.id,
      },
    });

    // Al abrir, importa las ventas en efectivo del día que aún no estén en
    // ninguna caja (por si vendieron antes de abrir), para que el arqueo cuadre.
    await this.reconcileCashSales(register);

    const full = await this.prisma.cashRegister.findUnique({
      where: { id: register.id },
      include: { movements: true },
    });

    const gastos = await this.sumCashExpenses(register);
    return {
      success: true,
      message: 'Caja abierta',
      data: { ...full, totals: computeTotals(full, gastos) },
    };
  }

  // Suma los GASTOS en EFECTIVO registrados durante la vida de la caja (del
  // inicio del día en que se abrió hasta su cierre, o hasta ahora si sigue
  // abierta), en la misma sede. Son las SALIDAS de efectivo del cajón: se
  // descuentan del esperado para que el arqueo cuadre. Se cuentan por la fecha
  // de registro (createdAt) y se excluyen los gastos eliminados.
  private async sumCashExpenses(register: {
    localId: number;
    openedAt: Date;
    closedAt: Date | null;
  }): Promise<number> {
    const createdAt: any = {
      gte: this.colombiaDayStart(new Date(register.openedAt)),
    };
    if (register.closedAt) createdAt.lt = register.closedAt;
    const agg = await this.prisma.expense.aggregate({
      where: {
        localId: register.localId,
        paymentMethod: 'EFECTIVO' as any,
        status: { not: 'ELIMINADO' as any },
        createdAt,
      },
      _sum: { amount: true },
    });
    return Number(agg._sum.amount || 0);
  }

  // Inicio del día (zona Colombia UTC-5) de una fecha, expresado en UTC.
  private colombiaDayStart(date: Date): Date {
    const col = new Date(date.getTime() - 5 * 3600 * 1000);
    return new Date(
      Date.UTC(col.getUTCFullYear(), col.getUTCMonth(), col.getUTCDate(), 5, 0, 0),
    );
  }

  // AUTO-RECONCILIACIÓN de DOS VÍAS entre la caja y las ventas en efectivo del
  // local (desde el día en que se abrió la caja). Deja la caja SIEMPRE cuadrada
  // con el reporte de ventas, sin importar si la venta se creó, editó o eliminó,
  // ni si ocurrió antes de abrir, después de cerrar o durante un reinicio:
  //   1) PURGA los movimientos automáticos ("Venta en efectivo") que ya no
  //      corresponden: venta eliminada (saleId quedó null), venta anulada, o el
  //      importe cambió al editarla.
  //   2) AÑADE las ventas en efectivo válidas que aún no tienen movimiento.
  // Es idempotente.
  private async reconcileCashSales(register: {
    id: number;
    localId: number;
    openedAt: Date;
    openedById: number | null;
    closedAt: Date | null;
  }) {
    const saleDate: any = {
      gte: this.colombiaDayStart(new Date(register.openedAt)),
    };
    if (register.closedAt) saleDate.lt = register.closedAt;

    // Ventas en efectivo VÁLIDAS de la ventana (id -> importe actual).
    const validSales = await this.prisma.sale.findMany({
      where: {
        localId: register.localId,
        paymentMethod: 'EFECTIVO',
        saleStatus: { notIn: ['CANCELADA', 'RECHAZADA', 'DEVUELTA'] as any },
        // Plan separe activo: su dinero entra por ABONOS (concept 'Abono plan
        // separe'), nunca como 'Venta en efectivo' por el total. Excluirlo evita
        // que la reconciliación le cree un movimiento duplicado por el total.
        paymentStatus: { not: 'PLAN_SEPARE' as any },
        saleDate,
      },
      select: { id: true, totalAmount: true },
    });
    const validMap = new Map(validSales.map((s) => [s.id, s.totalAmount]));

    // (1) PURGA: movimientos automáticos de esta caja que ya no cuadran.
    const autoMovs = await this.prisma.cashMovement.findMany({
      where: { cashRegisterId: register.id, concept: 'Venta en efectivo' },
      select: { id: true, saleId: true, amount: true },
    });
    const toDelete: number[] = [];
    for (const m of autoMovs) {
      // Huérfano: la venta fue eliminada (SetNull dejó saleId en null).
      if (m.saleId == null) {
        toDelete.push(m.id);
        continue;
      }
      const currentAmount = validMap.get(m.saleId);
      // La venta ya no es válida (anulada, cambió de método o de fecha).
      if (currentAmount == null) {
        toDelete.push(m.id);
        continue;
      }
      // El importe cambió al editar la venta → se borra y se recrea abajo.
      if (Number(currentAmount) !== Number(m.amount)) {
        toDelete.push(m.id);
      }
    }
    if (toDelete.length) {
      await this.prisma.cashMovement.deleteMany({
        where: { id: { in: toDelete } },
      });
    }

    // (2) AÑADE: ventas válidas que quedaron sin ningún movimiento asociado
    // (nuevas, o recién purgadas por cambio de importe). Se excluyen las que ya
    // tienen movimiento en cualquier caja para no duplicar.
    const missing = await this.prisma.sale.findMany({
      where: {
        localId: register.localId,
        paymentMethod: 'EFECTIVO',
        saleStatus: { notIn: ['CANCELADA', 'RECHAZADA', 'DEVUELTA'] as any },
        // No autogenerar "Venta en efectivo" para apartados activos.
        paymentStatus: { not: 'PLAN_SEPARE' as any },
        saleDate,
        cashMovements: { none: {} },
      },
      select: { id: true, totalAmount: true },
    });

    for (const s of missing) {
      await this.prisma.cashMovement.create({
        data: {
          cashRegisterId: register.id,
          type: 'INGRESO',
          amount: s.totalAmount,
          concept: 'Venta en efectivo',
          saleId: s.id,
          userId: register.openedById,
        },
      });
    }
    return { added: missing.length, removed: toDelete.length };
  }

  async addMovement(user: any, id: number, dto: CashMovementDto) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!register) throw new NotFoundException('Caja no encontrada');
    await assertLocalAccess(this.prisma, user, register.localId);
    if (register.status !== 'ABIERTA') {
      throw new BadRequestException('La caja está cerrada');
    }

    await this.prisma.cashMovement.create({
      data: {
        cashRegisterId: id,
        type: dto.type,
        amount: dto.amount,
        concept: dto.concept,
        userId: user.id,
      },
    });

    return this.findOne(user, id);
  }

  async close(user: any, id: number, dto: CloseCashDto) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!register) throw new NotFoundException('Caja no encontrada');
    await assertLocalAccess(this.prisma, user, register.localId);
    if (register.status !== 'ABIERTA') {
      throw new BadRequestException('La caja ya está cerrada');
    }

    // Antes del arqueo, se asegura de tener TODAS las ventas en efectivo del día.
    await this.reconcileCashSales(register);
    const fresh = await this.prisma.cashRegister.findUnique({
      where: { id },
      include: { movements: true },
    });

    const gastos = await this.sumCashExpenses(register);
    const { expected } = computeTotals(fresh, gastos);
    const difference = (dto.countedAmount ?? 0) - expected;

    const updated = await this.prisma.cashRegister.update({
      where: { id },
      data: {
        status: 'CERRADA',
        closedAt: new Date(),
        closedById: user.id,
        countedAmount: dto.countedAmount,
        expectedAmount: expected,
        difference,
        notes: dto.notes ?? register.notes,
      },
      include: { movements: true },
    });

    return {
      success: true,
      message: 'Caja cerrada',
      data: { ...updated, totals: computeTotals(updated, gastos) },
    };
  }

  // Reabre una caja cerrada (por si se cerró por error). Solo si no hay otra
  // caja abierta en ese local. Limpia los datos del cierre.
  async reopen(user: any, id: number) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!register) throw new NotFoundException('Caja no encontrada');
    await assertLocalAccess(this.prisma, user, register.localId);
    if (register.status === 'ABIERTA') {
      throw new BadRequestException('La caja ya está abierta.');
    }
    const other = await this.prisma.cashRegister.findFirst({
      where: {
        localId: register.localId,
        companyId: user.companyId,
        status: 'ABIERTA',
      },
    });
    if (other) {
      throw new BadRequestException(
        'Ya hay otra caja abierta en este local. Ciérrala antes de reabrir esta.',
      );
    }
    const updated = await this.prisma.cashRegister.update({
      where: { id },
      data: {
        status: 'ABIERTA',
        closedAt: null,
        closedById: null,
        countedAmount: null,
        expectedAmount: null,
        difference: null,
      },
      include: { movements: true },
    });
    const gastos = await this.sumCashExpenses(updated);
    return {
      success: true,
      message: 'Caja reabierta',
      data: { ...updated, totals: computeTotals(updated, gastos) },
    };
  }

  // Corrige la base inicial de una caja ABIERTA (por si se abrió con un monto
  // equivocado o se olvidó). El "esperado" se recalcula solo al leer.
  async updateOpening(user: any, id: number, openingAmount: number) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!register) throw new NotFoundException('Caja no encontrada');
    await assertLocalAccess(this.prisma, user, register.localId);
    if (register.status !== 'ABIERTA') {
      throw new BadRequestException(
        'Solo se puede editar la base de una caja abierta.',
      );
    }
    const updated = await this.prisma.cashRegister.update({
      where: { id },
      data: { openingAmount: Number(openingAmount) || 0 },
      include: { movements: true },
    });
    const gastos = await this.sumCashExpenses(updated);
    return {
      success: true,
      message: 'Base inicial actualizada',
      data: { ...updated, totals: computeTotals(updated, gastos) },
    };
  }

  // Elimina/reinicia una caja (dueño/admin). Borra la caja y sus movimientos
  // (cascada). Las VENTAS quedan intactas: al abrir una nueva caja se vuelven a
  // importar las ventas en efectivo del día, así el arqueo queda igual. Sirve
  // para "reiniciar" una caja abierta por error o mal configurada.
  async remove(user: any, id: number) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!register) throw new NotFoundException('Caja no encontrada');
    await assertLocalAccess(this.prisma, user, register.localId);
    await this.prisma.cashRegister.delete({ where: { id } });
    return { success: true, message: 'Caja eliminada' };
  }

  async findAll(user: any, query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = { companyId: user.companyId };
    if (query.status) where.status = query.status;

    // Aislamiento por local: el usuario solo ve las cajas de sus locales
    // accesibles (el dueño, todas las de su empresa).
    const localIds = await getAccessibleLocalIds(this.prisma, user);
    if (localIds !== null) {
      where.localId = localIds.length ? { in: localIds } : -1;
    }
    if (query.localId && /^\d+$/.test(String(query.localId))) {
      const req = Number(query.localId);
      // El local solicitado solo aplica si está permitido.
      where.localId = localIds === null || localIds.includes(req) ? req : -1;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.cashRegister.findMany({
        where,
        skip,
        take: limit,
        orderBy: { openedAt: 'desc' },
        include: {
          openedBy: { select: { id: true, name: true } },
          closedBy: { select: { id: true, name: true } },
          local: { select: { id: true, name: true } },
          _count: { select: { movements: true } },
        },
      }),
      this.prisma.cashRegister.count({ where }),
    ]);

    return {
      success: true,
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(user: any, id: number) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        movements: {
          orderBy: { createdAt: 'desc' },
          include: { sale: { select: { id: true, code: true } } },
        },
        openedBy: { select: { id: true, name: true } },
        closedBy: { select: { id: true, name: true } },
        local: { select: { id: true, name: true } },
      },
    });
    if (!register) throw new NotFoundException('Caja no encontrada');
    await assertLocalAccess(this.prisma, user, register.localId);

    const gastos = await this.sumCashExpenses(register);
    return {
      success: true,
      data: { ...register, totals: computeTotals(register, gastos) },
    };
  }

  // Usado por ventas: si hay caja abierta en el local, registra el efectivo.
  async registerCashSale(
    localId: number,
    companyId: number,
    saleId: number,
    amount: number,
    userId?: number,
  ) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { localId, companyId, status: 'ABIERTA' },
    });
    if (!register) return null;

    return this.prisma.cashMovement.create({
      data: {
        cashRegisterId: register.id,
        type: 'INGRESO',
        amount,
        concept: 'Venta en efectivo',
        saleId,
        userId,
      },
    });
  }
}
