import { Test } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { LoansService, LOAN_SETTINGS_DEFAULTS, dateOnlyUTC } from './loans.service';
import { PrismaService } from '@/prisma.service';
import { AuditService } from '@/audit/audit.service';
import { PlanLimitsService } from '@/common/plan-limits.service';

// Pruebas del servicio con Prisma simulado: gate por tipo de negocio, alcance
// del cobrador, creación (plan + caja) y abonos. No requieren base de datos.
describe('LoansService', () => {
  const OWNER = { id: 1, name: 'Dueño', role: 'SUPER_ADMIN', companyId: 10 };
  const COBRADOR = { id: 7, name: 'Cobrador', role: 'COBRADOR', companyId: 10 };

  // Vencimientos como en producción: solo día (medianoche UTC del día Colombia).
  const futureDate = (days: number) => {
    const d = dateOnlyUTC();
    d.setUTCDate(d.getUTCDate() + days);
    return d;
  };

  const buildPrisma = (over: any = {}) => {
    const prisma: any = {
      company: {
        findUnique: jest.fn().mockResolvedValue({
          type: 'FINANCIERA',
          enabledModules: [],
          loanSettings: null,
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      businessTypeConfig: {
        findUnique: jest.fn().mockResolvedValue({
          active: true,
          modules: ['locals', 'users', 'customers', 'prestamos', 'cash', 'statistics'],
        }),
      },
      customer: {
        findFirst: jest.fn().mockResolvedValue({ id: 5, name: 'Ana', document: '123', phone: '300', localId: 2 }),
      },
      customerCreditProfile: { findFirst: jest.fn().mockResolvedValue(null) },
      loanProduct: { findFirst: jest.fn().mockResolvedValue(null) },
      user: { findFirst: jest.fn().mockResolvedValue({ id: 7, name: 'Cobrador', role: 'COBRADOR' }) },
      local: { findFirst: jest.fn().mockResolvedValue({ id: 2, companyId: 10 }) },
      loan: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 100, ...data })),
        update: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        aggregate: jest.fn().mockResolvedValue({ _sum: { principal: 0 }, _count: { _all: 0 } }),
      },
      loanInstallment: {
        deleteMany: jest.fn().mockResolvedValue({}),
        createMany: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      loanPayment: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 900, ...data })),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
        aggregate: jest.fn().mockResolvedValue({ _sum: {}, _count: { _all: 0 } }),
      },
      cashRegister: { findFirst: jest.fn().mockResolvedValue({ id: 77 }) },
      cashMovement: { create: jest.fn().mockResolvedValue({ id: 555 }) },
    };
    prisma.$transaction = jest.fn().mockImplementation((fn: any) => fn(prisma));
    return Object.assign(prisma, over);
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

  // Préstamo desembolsado de 300.000 al 10% a 3 cuotas mensuales (110.000 c/u),
  // cuota 1 pagada, cuota 2 vencida hace 5 días, cuota 3 futura.
  const loanFixture = (over: any = {}) => ({
    id: 100,
    code: 'PR-000001',
    status: 'DESEMBOLSADO',
    principal: 300000,
    interestRate: 10,
    moraRate: 3,
    graceDays: 0,
    frequency: 'MENSUAL',
    amortization: 'SIMPLE',
    termCount: 3,
    roundTo: 1,
    totalInterest: 30000,
    totalAmount: 330000,
    collectorId: 7,
    localId: 2,
    companyId: 10,
    customer: { id: 5, name: 'Ana' },
    collector: { id: 7, name: 'Cobrador' },
    product: null,
    local: { id: 2, name: 'Sede' },
    payments: [],
    installments: [
      { id: 1, number: 1, dueDate: futureDate(-40), capital: 100000, interest: 10000, capitalPaid: 100000, interestPaid: 10000, moraPaid: 0 },
      { id: 2, number: 2, dueDate: futureDate(-5), capital: 100000, interest: 10000, capitalPaid: 0, interestPaid: 0, moraPaid: 0 },
      { id: 3, number: 3, dueDate: futureDate(25), capital: 100000, interest: 10000, capitalPaid: 0, interestPaid: 0, moraPaid: 0 },
    ],
    ...over,
  });

  describe('gate por tipo de negocio', () => {
    it('rechaza si el tipo de la empresa no tiene el módulo prestamos (ej. COMERCIO)', async () => {
      const prisma = buildPrisma();
      prisma.company.findUnique.mockResolvedValue({ type: 'COMERCIO', enabledModules: [], loanSettings: null });
      prisma.businessTypeConfig.findUnique.mockResolvedValue({ active: true, modules: ['sales', 'inventory', 'cartera'] });
      const svc = await make(prisma);
      await expect(svc.list(OWNER)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('permite si la empresa es FINANCIERA (módulo prestamos en el tipo)', async () => {
      const svc = await make(buildPrisma());
      const r = await svc.list(OWNER);
      expect(r.success).toBe(true);
    });

    it('el control manual por empresa (enabledModules) manda sobre el tipo', async () => {
      const prisma = buildPrisma();
      prisma.company.findUnique.mockResolvedValue({ type: 'COMERCIO', enabledModules: ['customers', 'prestamos'], loanSettings: null });
      const svc = await make(prisma);
      const r = await svc.list(OWNER);
      expect(r.success).toBe(true);
    });
  });

  describe('configuración', () => {
    it('mezcla defaults con lo guardado en la empresa', async () => {
      const prisma = buildPrisma();
      prisma.company.findUnique.mockResolvedValue({ type: 'FINANCIERA', enabledModules: [], loanSettings: { defaultInterestRate: 5, requireApproval: true } });
      const svc = await make(prisma);
      const s = await svc.getSettings(10);
      expect(s.defaultInterestRate).toBe(5);
      expect(s.requireApproval).toBe(true);
      expect(s.defaultFrequency).toBe(LOAN_SETTINGS_DEFAULTS.defaultFrequency);
      expect(s.allocationOrder).toEqual(['MORA', 'INTERES', 'CAPITAL']);
    });
  });

  describe('alcance por rol', () => {
    it('el COBRADOR solo lista su cartera asignada', async () => {
      const prisma = buildPrisma();
      const svc = await make(prisma);
      await svc.list({ ...COBRADOR, localId: 2 });
      const where = prisma.loan.findMany.mock.calls[0][0].where;
      expect(where.collectorId).toBe(7);
    });

    it('el dueño ve toda la empresa (sin filtro de cobrador ni de sede)', async () => {
      const prisma = buildPrisma();
      const svc = await make(prisma);
      await svc.list(OWNER);
      const where = prisma.loan.findMany.mock.calls[0][0].where;
      expect(where.collectorId).toBeUndefined();
      expect(where.localId).toBeUndefined();
      expect(where.companyId).toBe(10);
    });

    it('el COBRADOR no puede abonar a un préstamo que no es suyo', async () => {
      const prisma = buildPrisma();
      prisma.loan.findFirst.mockResolvedValue(loanFixture({ collectorId: 99 }));
      const svc = await make(prisma);
      await expect(svc.addPayment(COBRADOR, 100, { amount: 1000 })).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('creación', () => {
    it('sin aprobación: crea DESEMBOLSADO, escribe el plan y saca el efectivo de caja', async () => {
      const prisma = buildPrisma();
      prisma.loan.findFirst.mockResolvedValue(loanFixture());
      const svc = await make(prisma);
      await svc.create(OWNER, {
        customerId: 5,
        principal: 300000,
        termCount: 3,
        interestRate: 10,
        frequency: 'MENSUAL',
        collectorId: 7,
      } as any);
      const created = prisma.loan.create.mock.calls[0][0].data;
      expect(created.code).toBe('PR-000001');
      expect(created.status).toBe('DESEMBOLSADO');
      expect(created.totalInterest).toBe(90000); // 300.000 × 10% × 3
      expect(created.totalAmount).toBe(390000);
      expect(created.rateSource).toBe('LOAN');
      expect(created.collectorId).toBe(7);
      const rows = prisma.loanInstallment.createMany.mock.calls[0][0].data;
      expect(rows).toHaveLength(3);
      expect(rows.every((r: any) => r.capital === 100000 && r.interest === 30000)).toBe(true);
      const mv = prisma.cashMovement.create.mock.calls[0][0].data;
      expect(mv.type).toBe('EGRESO');
      expect(mv.amount).toBe(300000);
      expect(mv.cashRegisterId).toBe(77);
    });

    it('con aprobación obligatoria: queda SOLICITADO, sin plan ni caja', async () => {
      const prisma = buildPrisma();
      prisma.company.findUnique.mockResolvedValue({ type: 'FINANCIERA', enabledModules: [], loanSettings: { requireApproval: true, defaultInterestRate: 4 } });
      prisma.loan.findFirst.mockResolvedValue(loanFixture({ status: 'SOLICITADO', installments: [] }));
      const svc = await make(prisma);
      await svc.create(OWNER, { customerId: 5, principal: 500000, termCount: 10, frequency: 'QUINCENAL' } as any);
      const created = prisma.loan.create.mock.calls[0][0].data;
      expect(created.status).toBe('SOLICITADO');
      expect(created.interestRate).toBe(4); // tasa de la empresa (cascada)
      expect(created.rateSource).toBe('COMPANY');
      expect(prisma.loanInstallment.createMany).not.toHaveBeenCalled();
      expect(prisma.cashMovement.create).not.toHaveBeenCalled();
    });

    it('usa la tasa propia del cliente por encima de la de la empresa', async () => {
      const prisma = buildPrisma();
      prisma.company.findUnique.mockResolvedValue({ type: 'FINANCIERA', enabledModules: [], loanSettings: { defaultInterestRate: 4 } });
      prisma.customerCreditProfile.findFirst.mockResolvedValue({ customRate: 2.5, product: null, blocked: false, creditLimit: null, collectorId: null });
      prisma.loan.findFirst.mockResolvedValue(loanFixture());
      const svc = await make(prisma);
      await svc.create(OWNER, { customerId: 5, principal: 100000, termCount: 2 } as any);
      const created = prisma.loan.create.mock.calls[0][0].data;
      expect(created.interestRate).toBe(2.5);
      expect(created.rateSource).toBe('CUSTOMER');
    });

    it('bloquea al cliente marcado como bloqueado y respeta el cupo', async () => {
      const prisma = buildPrisma();
      prisma.customerCreditProfile.findFirst.mockResolvedValue({ customRate: null, product: null, blocked: true, creditLimit: null, collectorId: null });
      const svc = await make(prisma);
      await expect(svc.create(OWNER, { customerId: 5, principal: 100000, termCount: 2 } as any)).rejects.toBeInstanceOf(BadRequestException);

      prisma.customerCreditProfile.findFirst.mockResolvedValue({ customRate: null, product: null, blocked: false, creditLimit: 50000, collectorId: null });
      await expect(svc.create(OWNER, { customerId: 5, principal: 100000, termCount: 2 } as any)).rejects.toThrow(/cupo/i);
    });

    it('el ANALISTA crea pero no desembolsa (queda SOLICITADO)', async () => {
      const prisma = buildPrisma();
      prisma.loan.findFirst.mockResolvedValue(loanFixture({ status: 'SOLICITADO', installments: [] }));
      const svc = await make(prisma);
      await svc.create({ id: 3, name: 'Ana Lista', role: 'ANALISTA', companyId: 10 }, { customerId: 5, principal: 100000, termCount: 2, interestRate: 3 } as any);
      expect(prisma.loan.create.mock.calls[0][0].data.status).toBe('SOLICITADO');
    });
  });

  describe('abonos', () => {
    it('rechaza un abono mayor a la deuda a hoy', async () => {
      const prisma = buildPrisma();
      prisma.loan.findFirst.mockResolvedValue(loanFixture());
      const svc = await make(prisma);
      await expect(svc.addPayment(OWNER, 100, { amount: 9_999_999 })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza abonos a préstamos no desembolsados', async () => {
      const prisma = buildPrisma();
      prisma.loan.findFirst.mockResolvedValue(loanFixture({ status: 'SOLICITADO' }));
      const svc = await make(prisma);
      await expect(svc.addPayment(OWNER, 100, { amount: 1000 })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('aplica mora → interés → capital a la cuota vencida y registra el ingreso en caja', async () => {
      const prisma = buildPrisma();
      prisma.loan.findFirst.mockResolvedValue(loanFixture());
      prisma.loanInstallment.findMany.mockResolvedValue(loanFixture().installments);
      const svc = await make(prisma);
      const r = await svc.addPayment(OWNER, 100, { amount: 50000, method: 'EFECTIVO' });
      // Mora: 100.000 × 3%/30 × 5 días = 500
      const pay = prisma.loanPayment.create.mock.calls[0][0].data;
      expect(pay.moraApplied).toBe(500);
      expect(pay.interestApplied).toBe(10000);
      expect(pay.capitalApplied).toBe(39500);
      expect(pay.amount).toBe(50000);
      expect(pay.cashMovementId).toBe(555);
      const instUpdate = prisma.loanInstallment.update.mock.calls[0][0];
      expect(instUpdate.where.id).toBe(2);
      expect(instUpdate.data.capitalPaid).toBe(39500);
      expect(instUpdate.data.moraPaid).toBe(500);
      expect(instUpdate.data.paidAt).toBeNull();
      const mv = prisma.cashMovement.create.mock.calls[0][0].data;
      expect(mv.type).toBe('INGRESO');
      expect(mv.amount).toBe(50000);
      expect(r.data.settled).toBe(false);
    });

    it('marca el préstamo PAGADO cuando el abono salda todo', async () => {
      const prisma = buildPrisma();
      prisma.loan.findFirst.mockResolvedValue(loanFixture());
      // Tras el abono, todas las cuotas quedan cubiertas.
      prisma.loanInstallment.findMany.mockResolvedValue(
        loanFixture().installments.map((i: any) => ({ ...i, capitalPaid: 100000, interestPaid: 10000 })),
      );
      const svc = await make(prisma);
      const r = await svc.addPayment(OWNER, 100, { amount: 220500, method: 'TRANSFERENCIA' });
      expect(r.data.settled).toBe(true);
      const upd = prisma.loan.update.mock.calls.find((c: any) => c[0].data.status === 'PAGADO');
      expect(upd).toBeTruthy();
      // Transferencia: no toca caja.
      expect(prisma.cashMovement.create).not.toHaveBeenCalled();
    });

    it('el COBRADOR puede abonar a su cartera si la empresa lo permite', async () => {
      const prisma = buildPrisma();
      prisma.loan.findFirst.mockResolvedValue(loanFixture({ collectorId: 7 }));
      prisma.loanInstallment.findMany.mockResolvedValue(loanFixture().installments);
      const svc = await make(prisma);
      const r = await svc.addPayment({ ...COBRADOR, localId: 2 }, 100, { amount: 10000 });
      expect(r.success).toBe(true);
      expect(prisma.loanPayment.create.mock.calls[0][0].data.createdById).toBe(7);
    });

    it('si la empresa lo prohíbe, el COBRADOR no registra abonos', async () => {
      const prisma = buildPrisma();
      prisma.company.findUnique.mockResolvedValue({ type: 'FINANCIERA', enabledModules: [], loanSettings: { collectorCanRegisterPayments: false } });
      prisma.loan.findFirst.mockResolvedValue(loanFixture({ collectorId: 7 }));
      const svc = await make(prisma);
      await expect(svc.addPayment(COBRADOR, 100, { amount: 10000 })).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('anular un abono revierte lo aplicado en las cuotas y saca el efectivo de caja', async () => {
      const prisma = buildPrisma();
      prisma.loan.findFirst.mockResolvedValue(loanFixture());
      prisma.loanPayment.findFirst.mockResolvedValue({
        id: 900, loanId: 100, companyId: 10, status: 'ACTIVO', method: 'EFECTIVO', amount: 50000,
        allocation: [{ number: 2, mora: 500, interest: 10000, capital: 39500 }],
      });
      prisma.loanInstallment.findFirst.mockResolvedValue({ id: 2, number: 2, capitalPaid: 39500, interestPaid: 10000, moraPaid: 500 });
      const svc = await make(prisma);
      await svc.annulPayment(OWNER, 100, 900, 'error de digitación');
      const upd = prisma.loanInstallment.update.mock.calls[0][0].data;
      expect(upd.capitalPaid).toBe(0);
      expect(upd.interestPaid).toBe(0);
      expect(upd.moraPaid).toBe(0);
      const payUpd = prisma.loanPayment.update.mock.calls[0][0].data;
      expect(payUpd.status).toBe('ANULADO');
      const mv = prisma.cashMovement.create.mock.calls[0][0].data;
      expect(mv.type).toBe('EGRESO');
      expect(mv.amount).toBe(50000);
    });
  });

  describe('ruta del cobrador', () => {
    it('la cuota que vence HOY aparece en "vencen hoy" (fechas solo-día, sin desplazarse un día)', async () => {
      const prisma = buildPrisma();
      const today = dateOnlyUTC();
      const loan = loanFixture({
        collectorId: 7,
        installments: [
          { id: 1, number: 1, dueDate: futureDate(-30), capital: 100000, interest: 10000, capitalPaid: 100000, interestPaid: 10000, moraPaid: 0 },
          { id: 2, number: 2, dueDate: today, capital: 100000, interest: 10000, capitalPaid: 0, interestPaid: 0, moraPaid: 0 },
          { id: 3, number: 3, dueDate: futureDate(30), capital: 100000, interest: 10000, capitalPaid: 0, interestPaid: 0, moraPaid: 0 },
        ],
      });
      prisma.loan.findMany.mockResolvedValue([loan]);
      const svc = await make(prisma);
      const r = await svc.collectorRoute({ ...COBRADOR, localId: 2 });
      expect(r.data.dueToday.map((l: any) => l.id)).toEqual([100]);
      expect(r.data.overdue).toHaveLength(0);
      expect(r.data.upcoming).toHaveLength(0);
      expect(r.data.totals.toCollectToday).toBe(110000);
    });
  });

  describe('simulador', () => {
    it('devuelve plan, términos resueltos y avisos sin guardar nada', async () => {
      const prisma = buildPrisma();
      prisma.company.findUnique.mockResolvedValue({ type: 'FINANCIERA', enabledModules: [], loanSettings: { defaultInterestRate: 3, usuryRateMonthly: 2 } });
      const svc = await make(prisma);
      const r = await svc.simulate(OWNER, { principal: 1000000, termCount: 10, frequency: 'MENSUAL' } as any);
      expect(r.data.terms.interestRate).toBe(3);
      expect(r.data.terms.rateSource).toBe('COMPANY');
      expect(r.data.plan.totalInterest).toBe(300000);
      expect(r.data.plan.installments).toHaveLength(10);
      expect(r.data.warnings.map((w: any) => w.code)).toContain('USURY');
      expect(prisma.loan.create).not.toHaveBeenCalled();
    });
  });
});
