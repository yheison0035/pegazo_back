import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { LoansService, dateOnlyUTC } from './loans.service';
import { PrismaService } from '@/prisma.service';
import { AuditService } from '@/audit/audit.service';
import { PlanLimitsService } from '@/common/plan-limits.service';

// Fase 2 con Prisma simulado: abono a capital (solo al día), liquidación
// anticipada, refinanciación y reporte mensual.
describe('LoansService · fase 2', () => {
  const OWNER = { id: 1, name: 'Dueño', role: 'SUPER_ADMIN', companyId: 10 };

  const monthsFromToday = (k: number) => {
    const d = dateOnlyUTC();
    d.setUTCMonth(d.getUTCMonth() + k);
    return d;
  };

  // 1.000.000 al 10% a 10 meses (cuota 200.000); 3 pagadas; resto futuro → AL DÍA.
  const alDia = () => ({
    id: 100, code: 'PR-000001', status: 'DESEMBOLSADO', principal: 1000000, interestRate: 10, moraRate: 3, graceDays: 0,
    frequency: 'MENSUAL', amortization: 'SIMPLE', termCount: 10, roundTo: 1, totalInterest: 1000000, totalAmount: 2000000,
    collectorId: 7, localId: 2, companyId: 10, customerId: 5, productId: null, rateSource: 'LOAN',
    customer: { id: 5, name: 'Ana' }, collector: null, product: null, local: null, payments: [],
    installments: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1, number: i + 1, dueDate: monthsFromToday(i - 2), capital: 100000, interest: 100000,
      capitalPaid: i < 3 ? 100000 : 0, interestPaid: i < 3 ? 100000 : 0, moraPaid: 0,
    })),
  });
  // 300.000 al 10% a 3: cuota 1 pagada, cuota 2 vencida hace 5 días, cuota 3 futura → EN MORA.
  const enMora = () => {
    const d = (days: number) => { const x = dateOnlyUTC(); x.setUTCDate(x.getUTCDate() + days); return x; };
    return {
      ...alDia(), id: 200, code: 'PR-000200', principal: 300000, termCount: 3, totalInterest: 30000, totalAmount: 330000,
      installments: [
        { id: 1, number: 1, dueDate: d(-40), capital: 100000, interest: 10000, capitalPaid: 100000, interestPaid: 10000, moraPaid: 0 },
        { id: 2, number: 2, dueDate: d(-5), capital: 100000, interest: 10000, capitalPaid: 0, interestPaid: 0, moraPaid: 0 },
        { id: 3, number: 3, dueDate: d(25), capital: 100000, interest: 10000, capitalPaid: 0, interestPaid: 0, moraPaid: 0 },
      ],
    };
  };

  const buildPrisma = (loan: any) => {
    const prisma: any = {
      company: { findUnique: jest.fn().mockResolvedValue({ type: 'FINANCIERA', enabledModules: [], loanSettings: null }) },
      businessTypeConfig: { findUnique: jest.fn().mockResolvedValue({ active: true, modules: ['customers', 'prestamos', 'cash'] }) },
      loan: {
        findFirst: jest.fn().mockResolvedValue(loan),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 300, ...data })),
        update: jest.fn().mockResolvedValue({}),
      },
      loanInstallment: {
        deleteMany: jest.fn().mockResolvedValue({}),
        createMany: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue(loan.installments),
      },
      loanPayment: {
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 900, ...data })),
        findMany: jest.fn().mockResolvedValue([]),
      },
      cashRegister: { findFirst: jest.fn().mockResolvedValue({ id: 77 }) },
      cashMovement: { create: jest.fn().mockResolvedValue({ id: 555 }) },
      local: { findFirst: jest.fn().mockResolvedValue({ id: 2 }) },
    };
    prisma.$transaction = jest.fn().mockImplementation((fn: any) => fn(prisma));
    return prisma;
  };
  const make = async (prisma: any) => {
    const mod = await Test.createTestingModule({
      providers: [
        LoansService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: PlanLimitsService, useValue: { assertModule: jest.fn() } },
      ],
    }).compile();
    return mod.get(LoansService);
  };

  describe('abono a capital', () => {
    it('rechaza si el préstamo no está al día', async () => {
      const svc = await make(buildPrisma(enMora()));
      await expect(svc.extraCapitalQuote(OWNER, 200, 50000, 'REDUCE_INSTALLMENT')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('cotiza sin guardar: 300.000 a capital baja la cuota a 97.143 y el interés a 280.000', async () => {
      const prisma = buildPrisma(alDia());
      const svc = await make(prisma);
      const r = await svc.extraCapitalQuote(OWNER, 100, 300000, 'REDUCE_INSTALLMENT');
      expect(r.data.remainingCapital).toBe(400000);
      expect(r.data.installmentAfter).toBe(97143);
      expect(r.data.interestAfter).toBe(280000);
      expect(r.data.removedNumbers).toEqual([4, 5, 6, 7, 8, 9, 10]);
      expect(prisma.loanInstallment.deleteMany).not.toHaveBeenCalled();
    });

    it('aplica: reemplaza las cuotas pendientes, registra el abono a capital y recalcula totales', async () => {
      const loan = alDia();
      const prisma = buildPrisma(loan);
      // Tras el abono: 3 pagadas (100.000 de interés c/u) + 7 nuevas (40.000 c/u).
      prisma.loanInstallment.findMany.mockResolvedValue([
        ...loan.installments.slice(0, 3),
        ...Array.from({ length: 7 }, (_, i) => ({ id: 20 + i, number: 4 + i, capital: 57143, interest: 40000, capitalPaid: 0, interestPaid: 0, moraPaid: 0, dueDate: monthsFromToday(i + 1) })),
      ]);
      const svc = await make(prisma);
      await svc.extraCapital(OWNER, 100, { amount: 300000, mode: 'REDUCE_INSTALLMENT', method: 'EFECTIVO' });
      expect(prisma.loanInstallment.deleteMany.mock.calls[0][0].where.number).toEqual({ in: [4, 5, 6, 7, 8, 9, 10] });
      expect(prisma.loanInstallment.createMany.mock.calls[0][0].data).toHaveLength(7);
      const pay = prisma.loanPayment.create.mock.calls[0][0].data;
      expect(pay.capitalApplied).toBe(300000);
      expect(pay.interestApplied).toBe(0);
      expect(pay.allocation.type).toBe('CAPITAL_EXTRA');
      expect(prisma.cashMovement.create.mock.calls[0][0].data).toMatchObject({ type: 'INGRESO', amount: 300000 });
      const upd = prisma.loan.update.mock.calls[0][0].data;
      expect(upd.termCount).toBe(10);
      expect(upd.totalInterest).toBe(580000);
      expect(upd.totalAmount).toBe(1580000);
    });

    it('acortar plazo: quedan 3 cuotas nuevas (6 en total)', async () => {
      const svc = await make(buildPrisma(alDia()));
      const r = await svc.extraCapitalQuote(OWNER, 100, 300000, 'REDUCE_TERM');
      expect(r.data.newInstallments).toHaveLength(3);
      expect(r.data.newTermCount).toBe(6);
    });

    it('no acepta un abono mayor al capital pendiente', async () => {
      const svc = await make(buildPrisma(alDia()));
      await expect(svc.extraCapital(OWNER, 100, { amount: 900000, mode: 'REDUCE_TERM' })).rejects.toThrow(/supera el capital/);
    });
  });

  describe('liquidación anticipada', () => {
    it('cotiza: capital pendiente + interés de la cuota en curso; perdona el futuro', async () => {
      const svc = await make(buildPrisma(alDia()));
      const q = await svc.settlementQuote(OWNER, 100);
      expect(q.data.capital).toBe(700000);
      expect(q.data.interest).toBe(100000);
      expect(q.data.total).toBe(800000);
      expect(q.data.forgivenInterest).toBe(600000);
    });

    it('salda: cobra 800.000, cierra todas las cuotas y marca PAGADO', async () => {
      const loan = alDia();
      const prisma = buildPrisma(loan);
      prisma.loanInstallment.findMany.mockResolvedValue(loan.installments.map((i: any, idx: number) => ({ ...i, interest: idx < 4 ? 100000 : 0 })));
      const svc = await make(prisma);
      await svc.settle(OWNER, 100, { method: 'TRANSFERENCIA' });
      expect(prisma.loanInstallment.update).toHaveBeenCalledTimes(7);
      // La cuota en curso (4) cobra su interés; una futura (5) lo perdona (interest → 0).
      const u4 = prisma.loanInstallment.update.mock.calls.find((c: any) => c[0].where.id === 4)[0].data;
      const u5 = prisma.loanInstallment.update.mock.calls.find((c: any) => c[0].where.id === 5)[0].data;
      expect(u4).toMatchObject({ capitalPaid: 100000, interestPaid: 100000, interest: 100000 });
      expect(u5).toMatchObject({ capitalPaid: 100000, interestPaid: 0, interest: 0 });
      const pay = prisma.loanPayment.create.mock.calls[0][0].data;
      expect(pay.amount).toBe(800000);
      expect(pay.allocation.type).toBe('LIQUIDACION');
      expect(pay.allocation.forgivenInterest).toBe(600000);
      expect(prisma.cashMovement.create).not.toHaveBeenCalled(); // transferencia no toca caja
      const upd = prisma.loan.update.mock.calls[0][0].data;
      expect(upd.status).toBe('PAGADO');
      expect(upd.totalInterest).toBe(400000);
    });
  });

  describe('refinanciación', () => {
    it('la deuda a hoy (con mora) pasa a un préstamo nuevo y el viejo queda REFINANCIADO', async () => {
      const prisma = buildPrisma(enMora());
      const svc = await make(prisma);
      await svc.refinance(OWNER, 200, { termCount: 6, frequency: 'QUINCENAL', interestRate: 5 });
      const created = prisma.loan.create.mock.calls[0][0].data;
      // capital 200.000 + interés causado (cuota 2 vencida + cuota 3 en curso) 20.000 + mora 500
      expect(created.principal).toBe(220500);
      expect(created.termCount).toBe(6);
      expect(created.frequency).toBe('QUINCENAL');
      expect(created.interestRate).toBe(5);
      expect(created.refinancedFromId).toBe(200);
      expect(created.status).toBe('DESEMBOLSADO');
      expect(prisma.loanInstallment.createMany.mock.calls[0][0].data).toHaveLength(6);
      const old = prisma.loan.update.mock.calls.find((c: any) => c[0].where.id === 200)[0].data;
      expect(old.status).toBe('REFINANCIADO');
      expect(prisma.cashMovement.create).not.toHaveBeenCalled(); // no se entrega dinero
    });

    it('puede perdonar la mora al refinanciar', async () => {
      const prisma = buildPrisma(enMora());
      const svc = await make(prisma);
      await svc.refinance(OWNER, 200, { termCount: 3, forgiveMora: true });
      expect(prisma.loan.create.mock.calls[0][0].data.principal).toBe(220000);
    });
  });

  describe('reporte mensual', () => {
    it('devuelve una fila por mes del rango con colocación y recaudo', async () => {
      const prisma = buildPrisma(alDia());
      const now = dateOnlyUTC();
      prisma.loan.findMany.mockResolvedValue([{ principal: 500000, disbursedAt: now }]);
      prisma.loanPayment.findMany.mockResolvedValue([{ amount: 120000, capitalApplied: 100000, interestApplied: 20000, moraApplied: 0, paidAt: now }]);
      const svc = await make(prisma);
      const r = await svc.reportsMonthly(OWNER, { months: 3 });
      expect(r.data.months).toHaveLength(3);
      const last = r.data.months[2];
      expect(last.placed).toBe(500000);
      expect(last.collected).toBe(120000);
      expect(last.interest).toBe(20000);
      expect(r.data.totals).toMatchObject({ placed: 500000, collected: 120000, interest: 20000 });
    });
  });
});
