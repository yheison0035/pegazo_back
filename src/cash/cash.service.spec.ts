import { Test } from '@nestjs/testing';
import { CashService } from './cash.service';
import { PrismaService } from '@/prisma.service';

// La caja conecta INGRESOS (ventas en efectivo) y GASTOS en efectivo del día:
// el esperado = base + ventas en efectivo − gastos en efectivo. Toca dinero, así
// que se prueba el cálculo del arqueo y el filtro de gastos.
describe('CashService · totales con gastos en efectivo', () => {
  // Dueño: ve todas las cajas de su empresa (rol global).
  const user = { companyId: 1, id: 9, role: 'SUPER_ADMIN' };
  const base = {
    id: 5,
    localId: 1,
    companyId: 1,
    status: 'ABIERTA',
    openingAmount: 100000,
    openedAt: new Date('2026-11-02T14:00:00Z'),
    closedAt: null,
    openedById: 9,
  };
  let prisma: any;
  let svc: CashService;

  beforeEach(async () => {
    prisma = {
      local: { findFirst: jest.fn().mockResolvedValue({ id: 1, companyId: 1 }) },
      cashRegister: {
        findFirst: jest.fn().mockResolvedValue(base),
        findUnique: jest.fn().mockResolvedValue({
          ...base,
          movements: [
            { id: 1, type: 'INGRESO', amount: 50000, concept: 'Venta en efectivo' },
          ],
        }),
      },
      // reconcileCashSales: sin ventas nuevas ni movimientos a purgar.
      sale: { findMany: jest.fn().mockResolvedValue([]) },
      cashMovement: {
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({ id: 1 }),
      },
      expense: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 20000 } }),
      },
    };
    const mod = await Test.createTestingModule({
      providers: [
        CashService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    svc = mod.get(CashService);
  });

  it('el esperado resta los gastos en efectivo del día', async () => {
    const res = await svc.getCurrent(user, 1);
    const t = (res.data as any).totals;
    expect(t.ingresos).toBe(50000);
    expect(t.gastos).toBe(20000);
    // base 100.000 + ventas 50.000 − gastos 20.000 = 130.000
    expect(t.expected).toBe(130000);
  });

  it('solo cuenta gastos en EFECTIVO, de la sede y no eliminados', async () => {
    await svc.getCurrent(user, 1);
    expect(prisma.expense.aggregate).toHaveBeenCalledTimes(1);
    const where = prisma.expense.aggregate.mock.calls[0][0].where;
    expect(where.localId).toBe(1);
    expect(where.paymentMethod).toBe('EFECTIVO');
    expect(where.status).toEqual({ not: 'ELIMINADO' });
    expect(where.createdAt).toBeTruthy(); // acotado a la ventana de la caja
  });

  it('sin gastos en efectivo el esperado es base + ventas', async () => {
    prisma.expense.aggregate.mockResolvedValue({ _sum: { amount: null } });
    const res = await svc.getCurrent(user, 1);
    expect((res.data as any).totals.gastos).toBe(0);
    expect((res.data as any).totals.expected).toBe(150000);
  });
});

// Ventas en efectivo cargadas en la caja de SU sede (individual por local).
// Caso reportado: al registrar ventas en efectivo, la caja no cargaba bien de
// forma individual por sede. Este test simula una venta en efectivo en la sede 1
// y otra en la sede 2 (ambas sin movimiento previo) y verifica que la auto-
// reconciliación carga cada una en la caja de SU sede, sin mezclarse ni
// duplicarse.
describe('CashService · ventas en efectivo por sede (individual)', () => {
  const owner = { companyId: 1, id: 9, role: 'SUPER_ADMIN' };

  // Dos cajas abiertas, una por sede, abiertas hoy a las 12:00Z.
  const registers = [
    { id: 11, localId: 1, companyId: 1, status: 'ABIERTA', openingAmount: 0, openedAt: new Date('2026-11-02T12:00:00Z'), closedAt: null, openedById: 9 },
    { id: 22, localId: 2, companyId: 1, status: 'ABIERTA', openingAmount: 0, openedAt: new Date('2026-11-02T12:00:00Z'), closedAt: null, openedById: 9 },
  ];
  // Ventas del día: efectivo sede 1 (50k), efectivo sede 2 (80k) y una de tarjeta
  // en la sede 1 (no debe entrar a caja).
  const sales = [
    { id: 101, localId: 1, paymentMethod: 'EFECTIVO', saleStatus: 'NUEVA', paymentStatus: 'PAGADA', totalAmount: 50000, saleDate: new Date('2026-11-02T15:00:00Z') },
    { id: 102, localId: 2, paymentMethod: 'EFECTIVO', saleStatus: 'NUEVA', paymentStatus: 'PAGADA', totalAmount: 80000, saleDate: new Date('2026-11-02T16:00:00Z') },
    { id: 103, localId: 1, paymentMethod: 'TARJETA', saleStatus: 'NUEVA', paymentStatus: 'PAGADA', totalAmount: 99999, saleDate: new Date('2026-11-02T17:00:00Z') },
  ];

  let movements: any[];
  let movSeq: number;
  let svc: CashService;

  const withinWindow = (d: Date, w: any) =>
    (!w?.gte || d >= w.gte) && (!w?.lt || d < w.lt);

  beforeEach(async () => {
    movements = [];
    movSeq = 1;
    const prisma: any = {
      // assertLocalAccess (dueño global): valida que el local sea de su empresa.
      local: { findFirst: jest.fn(async ({ where }: any) => ({ id: where.id, companyId: 1 })) },
      cashRegister: {
        findFirst: jest.fn(async ({ where }: any) =>
          registers.find(
            (r) => r.localId === where.localId && r.companyId === where.companyId && r.status === where.status,
          ) || null,
        ),
        findUnique: jest.fn(async ({ where, include }: any) => {
          const r = registers.find((x) => x.id === where.id);
          if (!r) return null;
          const out: any = { ...r };
          if (include?.movements) out.movements = movements.filter((m) => m.cashRegisterId === r.id);
          if (include?.openedBy) out.openedBy = { id: 9, name: 'Dueño' };
          if (include?.local) out.local = { id: r.localId, name: `Sede ${r.localId}` };
          return out;
        }),
      },
      sale: {
        findMany: jest.fn(async ({ where }: any) => {
          let res = sales.filter(
            (s) =>
              s.localId === where.localId &&
              s.paymentMethod === where.paymentMethod &&
              !where.saleStatus.notIn.includes(s.saleStatus) &&
              s.paymentStatus !== where.paymentStatus.not &&
              withinWindow(s.saleDate, where.saleDate),
          );
          // `cashMovements: { none: {} }` → solo ventas sin NINGÚN movimiento.
          if (where.cashMovements?.none) {
            res = res.filter((s) => !movements.some((m) => m.saleId === s.id));
          }
          return res.map((s) => ({ id: s.id, totalAmount: s.totalAmount }));
        }),
      },
      cashMovement: {
        findMany: jest.fn(async ({ where }: any) =>
          movements
            .filter((m) => m.cashRegisterId === where.cashRegisterId && (!where.concept || m.concept === where.concept))
            .map((m) => ({ id: m.id, saleId: m.saleId, amount: m.amount })),
        ),
        deleteMany: jest.fn(async ({ where }: any) => {
          const ids = where.id.in;
          movements = movements.filter((m) => !ids.includes(m.id));
          return { count: ids.length };
        }),
        create: jest.fn(async ({ data }: any) => {
          const m = { id: movSeq++, ...data };
          movements.push(m);
          return m;
        }),
      },
      expense: { aggregate: jest.fn(async () => ({ _sum: { amount: 0 } })) },
    };
    const mod = await Test.createTestingModule({
      providers: [CashService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    svc = mod.get(CashService);
  });

  it('cada venta en efectivo carga en la caja de SU sede, sin mezclarse', async () => {
    const r1: any = await svc.getCurrent(owner, 1);
    const r2: any = await svc.getCurrent(owner, 2);

    // Sede 1 solo ve su venta de efectivo (50k), NO la de la sede 2 ni la tarjeta.
    expect(r1.data.totals.ingresos).toBe(50000);
    expect(r1.data.totals.expected).toBe(50000);
    // Sede 2 solo ve su venta de efectivo (80k).
    expect(r2.data.totals.ingresos).toBe(80000);
    expect(r2.data.totals.expected).toBe(80000);

    // El movimiento de cada venta quedó en la caja de su propia sede.
    expect(movements.find((m) => m.saleId === 101).cashRegisterId).toBe(11);
    expect(movements.find((m) => m.saleId === 102).cashRegisterId).toBe(22);
    // La venta de tarjeta (103) nunca entra a caja.
    expect(movements.some((m) => m.saleId === 103)).toBe(false);

    // Suma por caja: 50k en la sede 1, 80k en la sede 2 (sin cruce).
    const sum = (regId: number) => movements.filter((m) => m.cashRegisterId === regId).reduce((s, m) => s + m.amount, 0);
    expect(sum(11)).toBe(50000);
    expect(sum(22)).toBe(80000);
  });

  it('es idempotente: volver a abrir/mirar la caja no duplica la venta', async () => {
    await svc.getCurrent(owner, 1);
    await svc.getCurrent(owner, 1);
    await svc.getCurrent(owner, 1);
    const movsSede1 = movements.filter((m) => m.cashRegisterId === 11);
    expect(movsSede1).toHaveLength(1);
    expect(movsSede1[0].amount).toBe(50000);
  });
});

// Aislamiento por local: un rol de sede no puede ver la caja de OTRO local.
describe('CashService · aislamiento por local', () => {
  it('un rol de sede no accede a la caja de otro local (403)', async () => {
    const prisma: any = {
      // El usuario (CAJA) está asignado al local 2; su único local accesible es el 2.
      local: { findFirst: jest.fn().mockResolvedValue({ id: 2, companyId: 1 }) },
      cashRegister: { findFirst: jest.fn() },
    };
    const mod = await Test.createTestingModule({
      providers: [CashService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    const svc = mod.get(CashService);

    // Pide la caja del local 1 (no es el suyo) → prohibido, y ni siquiera
    // consulta la caja.
    await expect(
      svc.getCurrent({ companyId: 1, id: 7, role: 'CAJA', localId: 2 }, 1),
    ).rejects.toThrow('No tienes acceso a este local');
    expect(prisma.cashRegister.findFirst).not.toHaveBeenCalled();
  });
});
