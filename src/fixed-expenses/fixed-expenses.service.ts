import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { ExpenseType, Status } from '@prisma/client';
import { CreateFixedExpenseDto } from './dto/create-fixed-expense.dto';
import { UpdateFixedExpenseDto } from './dto/update-fixed-expense.dto';
import { PayFixedExpenseDto } from './dto/pay-fixed-expense.dto';

// Gastos fijos / recurrentes (arriendo, servicios, internet…): se definen una
// vez y cada mes se marcan como pagados, lo que genera un Expense real
// vinculado. Así el dueño ve de un vistazo lo fijo y qué falta por pagar.
@Injectable()
export class FixedExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  // Ventana del MES calendario actual (hora Colombia, UTC-5) para saber qué
  // gastos fijos ya se pagaron este mes.
  private currentMonth() {
    const now = new Date();
    const co = new Date(now.getTime() - 5 * 3600 * 1000);
    const y = co.getUTCFullYear();
    const m = co.getUTCMonth();
    const start = new Date(Date.UTC(y, m, 1));
    const end = new Date(Date.UTC(y, m + 1, 1));
    const MES = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ];
    return { start, end, label: `${MES[m]} ${y}` };
  }

  // Resuelve la categoría elegida al enum `type` (para estadísticas/payables).
  private async resolveType(categoryId: number | null, companyId: number) {
    if (categoryId) {
      const cat = await this.prisma.expenseCategory.findFirst({
        where: { id: categoryId, companyId },
      });
      if (cat) {
        const code = cat.code || '';
        const type = (Object.values(ExpenseType) as string[]).includes(code)
          ? (code as ExpenseType)
          : ExpenseType.OTROS;
        return { expenseCategoryId: cat.id, type };
      }
    }
    return { expenseCategoryId: null, type: ExpenseType.OTROS };
  }

  // Local por defecto: el que venga en el dto (validado) o el primero de la empresa.
  private async resolveLocalId(companyId: number, localId?: number) {
    if (localId) {
      const l = await this.prisma.local.findFirst({
        where: { id: Number(localId), companyId },
        select: { id: true },
      });
      if (l) return l.id;
    }
    const first = await this.prisma.local.findFirst({
      where: { companyId },
      orderBy: { id: 'asc' },
      select: { id: true },
    });
    if (!first)
      throw new BadRequestException('La empresa no tiene un local configurado.');
    return first.id;
  }

  async list(user: any) {
    const fixed = await this.prisma.fixedExpense.findMany({
      where: { companyId: user.companyId, status: { not: Status.ELIMINADO } },
      include: {
        expenseCategory: { select: { id: true, name: true } },
        local: { select: { id: true, name: true } },
      },
      orderBy: [{ dueDay: 'asc' }, { name: 'asc' }],
    });

    const ids = fixed.map((f) => f.id);
    const { start, end, label } = this.currentMonth();

    const payments = ids.length
      ? await this.prisma.expense.findMany({
          where: {
            fixedExpenseId: { in: ids },
            status: Status.ACTIVO,
            expenseDate: { gte: start, lt: end },
          },
          orderBy: { expenseDate: 'desc' },
          select: {
            id: true,
            fixedExpenseId: true,
            amount: true,
            expenseDate: true,
            notes: true,
            paymentMethod: true,
          },
        })
      : [];

    const payByFixed: Record<number, any> = {};
    for (const p of payments) {
      if (p.fixedExpenseId != null && !payByFixed[p.fixedExpenseId]) {
        payByFixed[p.fixedExpenseId] = p;
      }
    }

    const data = fixed.map((f) => {
      const lastPayment = payByFixed[f.id] || null;
      return { ...f, paidThisMonth: !!lastPayment, lastPayment };
    });

    const paid = data.filter((d) => d.paidThisMonth);
    const pending = data.filter((d) => !d.paidThisMonth);
    const summary = {
      period: label,
      count: fixed.length,
      totalFixed: fixed.reduce((s, f) => s + f.amount, 0),
      paidCount: paid.length,
      paidAmount: paid.reduce(
        (s, d) => s + (d.lastPayment?.amount ?? d.amount),
        0,
      ),
      pendingCount: pending.length,
      pendingAmount: pending.reduce((s, d) => s + d.amount, 0),
    };

    return { success: true, data, summary };
  }

  async create(user: any, dto: CreateFixedExpenseDto) {
    if (!dto.name?.trim())
      throw new BadRequestException('El nombre es obligatorio.');
    // El monto es opcional: si varía cada mes, se deja vacío (0) y se define al
    // pagar. No se exige mayor a 0 al crear.

    const localId = await this.resolveLocalId(user.companyId, dto.localId);
    const { expenseCategoryId } = await this.resolveType(
      dto.expenseCategoryId ?? null,
      user.companyId,
    );

    const created = await this.prisma.fixedExpense.create({
      data: {
        companyId: user.companyId,
        name: dto.name.trim(),
        amount: Number(dto.amount) > 0 ? Number(dto.amount) : 0,
        dueDay: dto.dueDay ?? null,
        expenseCategoryId,
        localId,
        providerId: dto.providerId ?? null,
        paidTo: dto.paidTo?.trim() || null,
        notes: dto.notes?.trim() || null,
      },
    });
    return { success: true, data: created };
  }

  async update(user: any, id: number, dto: UpdateFixedExpenseDto) {
    const fx = await this.prisma.fixedExpense.findFirst({
      where: { id: Number(id), companyId: user.companyId },
    });
    if (!fx) throw new NotFoundException('Gasto fijo no encontrado');

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.amount !== undefined) data.amount = Number(dto.amount);
    if (dto.dueDay !== undefined) data.dueDay = dto.dueDay ?? null;
    if (dto.paidTo !== undefined) data.paidTo = dto.paidTo?.trim() || null;
    if (dto.notes !== undefined) data.notes = dto.notes?.trim() || null;
    if (dto.providerId !== undefined) data.providerId = dto.providerId ?? null;
    if (dto.expenseCategoryId !== undefined) {
      const { expenseCategoryId } = await this.resolveType(
        dto.expenseCategoryId ?? null,
        user.companyId,
      );
      data.expenseCategoryId = expenseCategoryId;
    }
    if (dto.localId !== undefined) {
      data.localId = await this.resolveLocalId(user.companyId, dto.localId);
    }

    const updated = await this.prisma.fixedExpense.update({
      where: { id: fx.id },
      data,
    });
    return { success: true, data: updated };
  }

  async remove(user: any, id: number) {
    const fx = await this.prisma.fixedExpense.findFirst({
      where: { id: Number(id), companyId: user.companyId },
    });
    if (!fx) throw new NotFoundException('Gasto fijo no encontrado');
    // Borrado lógico: se mantiene el histórico de sus pagos (Expenses).
    await this.prisma.fixedExpense.update({
      where: { id: fx.id },
      data: { status: Status.ELIMINADO },
    });
    return { success: true };
  }

  // Marca el gasto fijo como pagado: crea el Expense real vinculado (con su
  // fecha y observación). NO afecta la caja (los gastos son independientes).
  async pay(user: any, id: number, dto: PayFixedExpenseDto) {
    const fx = await this.prisma.fixedExpense.findFirst({
      where: { id: Number(id), companyId: user.companyId },
    });
    if (!fx) throw new NotFoundException('Gasto fijo no encontrado');

    const { start, end } = this.currentMonth();
    const already = await this.prisma.expense.findFirst({
      where: {
        fixedExpenseId: fx.id,
        status: Status.ACTIVO,
        expenseDate: { gte: start, lt: end },
      },
      select: { id: true },
    });
    if (already)
      throw new BadRequestException('Este gasto fijo ya se pagó este mes.');

    const { type } = await this.resolveType(fx.expenseCategoryId, user.companyId);
    // El monto del pago manda. Si no viene, se usa el habitual del gasto fijo.
    // Como el monto habitual ahora es opcional, exigimos un valor al pagar.
    const amount =
      dto.amount != null && Number(dto.amount) > 0
        ? Number(dto.amount)
        : fx.amount;
    if (!(amount > 0))
      throw new BadRequestException('Ingresa el monto del pago.');

    const expense = await this.prisma.expense.create({
      data: {
        concept: fx.name,
        type,
        amount,
        paymentMethod: dto.paymentMethod ?? null,
        paidTo: fx.paidTo ?? null,
        notes: dto.notes?.trim() || null,
        expenseDate: new Date(dto.paymentDate),
        localId: fx.localId,
        providerId: fx.providerId ?? null,
        expenseCategoryId: fx.expenseCategoryId ?? null,
        fixedExpenseId: fx.id,
      },
    });
    return { success: true, data: expense };
  }

  // Deshace el pago del mes actual (por si se registró por error): borra el
  // Expense vinculado y el gasto fijo vuelve a "pendiente".
  async unpay(user: any, id: number) {
    const fx = await this.prisma.fixedExpense.findFirst({
      where: { id: Number(id), companyId: user.companyId },
      select: { id: true },
    });
    if (!fx) throw new NotFoundException('Gasto fijo no encontrado');

    const { start, end } = this.currentMonth();
    const payment = await this.prisma.expense.findFirst({
      where: {
        fixedExpenseId: fx.id,
        status: Status.ACTIVO,
        expenseDate: { gte: start, lt: end },
      },
      orderBy: { expenseDate: 'desc' },
      select: { id: true },
    });
    if (!payment)
      throw new BadRequestException('No hay un pago de este mes para deshacer.');

    await this.prisma.expense.update({
      where: { id: payment.id },
      data: { status: Status.ELIMINADO },
    });
    return { success: true };
  }
}
