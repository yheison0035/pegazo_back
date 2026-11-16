import { Test } from '@nestjs/testing';
import { ExpensesService } from './expenses.service';
import { PrismaService } from '@/prisma.service';
import { AuditService } from '@/audit/audit.service';
import { PlanLimitsService } from '@/common/plan-limits.service';

// Política "abrir el día" en Gastos: si la empresa exige abrir caja
// (requireCashOpen=true), NO se puede registrar ningún gasto sin una caja
// abierta HOY en la sede. Las empresas que NO usan abrir caja no se ven
// afectadas (sigue siendo editable por empresa).
describe('ExpensesService · exigir caja abierta para registrar gastos', () => {
  const owner = { companyId: 1, id: 9, role: 'SUPER_ADMIN' };
  const dto: any = {
    concept: 'almuerzo',
    amount: 20000,
    paymentMethod: 'EFECTIVO',
    localId: 1,
    expenseDate: '2026-11-16T15:00:00Z',
  };

  const build = (over: any = {}) => ({
    company: {
      findUnique: jest.fn().mockResolvedValue({
        booksClosedUntil: null,
        requireCashOpen: over.requireCashOpen ?? false,
      }),
    },
    local: { findFirst: jest.fn().mockResolvedValue({ id: 1, companyId: 1 }) },
    cashRegister: {
      findFirst: jest.fn().mockResolvedValue(over.openRegister ?? null),
    },
    expenseCategory: { findFirst: jest.fn().mockResolvedValue(null) },
    expense: { create: jest.fn().mockResolvedValue({ id: 77 }) },
  });

  const make = async (prisma: any): Promise<ExpensesService> => {
    const mod = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: PlanLimitsService, useValue: { assertCanCreate: jest.fn() } },
      ],
    }).compile();
    return mod.get(ExpensesService);
  };

  it('con "exigir abrir caja" y SIN caja abierta, NO deja registrar el gasto', async () => {
    const prisma: any = build({ requireCashOpen: true, openRegister: null });
    const svc = await make(prisma);
    await expect(svc.create(dto, owner)).rejects.toThrow(
      'Debes abrir el día (abrir la caja) para poder registrar gastos.',
    );
    expect(prisma.expense.create).not.toHaveBeenCalled();
  });

  it('con "exigir abrir caja" y la caja ABIERTA hoy, sí registra el gasto', async () => {
    const prisma: any = build({ requireCashOpen: true, openRegister: { id: 5 } });
    const svc = await make(prisma);
    const res = await svc.create(dto, owner);
    expect(res.success).toBe(true);
    expect(prisma.expense.create).toHaveBeenCalledTimes(1);
  });

  it('si la empresa NO exige abrir caja, registra el gasto aunque no haya caja', async () => {
    const prisma: any = build({ requireCashOpen: false, openRegister: null });
    const svc = await make(prisma);
    const res = await svc.create(dto, owner);
    expect(res.success).toBe(true);
    // Ni siquiera consulta la caja cuando la empresa no exige abrir el día.
    expect(prisma.cashRegister.findFirst).not.toHaveBeenCalled();
    expect(prisma.expense.create).toHaveBeenCalledTimes(1);
  });
});
