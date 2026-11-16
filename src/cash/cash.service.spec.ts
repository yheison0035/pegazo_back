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

// Red de regresión del flujo venta en efectivo -> caja. Deja clavado que la caja
// SIEMPRE refleja las ventas en efectivo del día (se vendan antes o después de
// abrirla), que lo que no es efectivo no entra, y que lo de otro día no se cuela.
// Caso reportado: ventas registradas por admin/recepcionista que a veces no
// aparecían en caja (segun el dia). La reconciliacion es por DIA de la caja.
describe('CashService · la caja refleja las ventas en efectivo del día', () => {
  const owner = { companyId: 1, id: 9, role: 'SUPER_ADMIN' };
  // Caja abierta HOY (16/11) a las 08:00 Colombia (13:00Z). El inicio del día
  // Colombia = 05:00Z; su ventana de reconciliación arranca ahí.
  const register = {
    id: 50,
    localId: 1,
    companyId: 1,
    status: 'ABIERTA',
    openingAmount: 0,
    openedAt: new Date('2026-11-16T13:00:00Z'),
    closedAt: null,
    openedById: 9,
  };

  const within = (d: Date, w: any) => (!w?.gte || d >= w.gte) && (!w?.lt || d < w.lt);

  // Prisma en memoria que respeta los filtros (localId, método, estado, fecha y
  // "sin movimiento"). Devuelve el servicio y un lector de los movimientos.
  const buildDb = (sales: any[], seedMovements: any[] = []) => {
    let movements = seedMovements.map((m, i) => ({ id: i + 1, ...m }));
    let seq = movements.length + 1;
    return {
      read: () => movements,
      prisma: {
        local: { findFirst: jest.fn(async ({ where }: any) => ({ id: where.id, companyId: register.companyId })) },
        cashRegister: {
          findFirst: jest.fn(async ({ where }: any) =>
            where.localId === register.localId && where.companyId === register.companyId && where.status === register.status
              ? register
              : null,
          ),
          findUnique: jest.fn(async ({ where, include }: any) => {
            if (where.id !== register.id) return null;
            const out: any = { ...register };
            if (include?.movements) out.movements = movements.filter((m) => m.cashRegisterId === register.id);
            if (include?.openedBy) out.openedBy = { id: register.openedById, name: 'Dueño' };
            if (include?.local) out.local = { id: register.localId, name: 'Sede' };
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
                within(s.saleDate, where.saleDate),
            );
            if (where.cashMovements?.none) res = res.filter((s) => !movements.some((m) => m.saleId === s.id));
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
            const before = movements.length;
            movements = movements.filter((m) => !ids.includes(m.id));
            return { count: before - movements.length };
          }),
          create: jest.fn(async ({ data }: any) => {
            const m = { id: seq++, ...data };
            movements.push(m);
            return m;
          }),
        },
        expense: { aggregate: jest.fn(async () => ({ _sum: { amount: 0 } })) },
      },
    };
  };

  const makeSvc = async (prisma: any): Promise<CashService> => {
    const mod = await Test.createTestingModule({
      providers: [CashService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    return mod.get(CashService);
  };

  const cashSale = (over: any) => ({
    localId: 1,
    paymentMethod: 'EFECTIVO',
    saleStatus: 'NUEVA',
    paymentStatus: 'PAGADA',
    saleDate: new Date('2026-11-16T14:00:00Z'),
    ...over,
  });

  it('una venta en efectivo del día aparece en la caja', async () => {
    const db = buildDb([cashSale({ id: 1, totalAmount: 30000 })]);
    const svc = await makeSvc(db.prisma);
    const res: any = await svc.getCurrent(owner, 1);
    expect(res.data.totals.ingresos).toBe(30000);
    expect(db.read().filter((m) => m.saleId === 1)).toHaveLength(1);
  });

  it('una venta en efectivo hecha ANTES de abrir la caja (mismo día) también aparece', async () => {
    // Vendida 06:00 Colombia (11:00Z), antes de abrir la caja a las 08:00.
    const db = buildDb([cashSale({ id: 2, totalAmount: 20000, saleDate: new Date('2026-11-16T11:00:00Z') })]);
    const svc = await makeSvc(db.prisma);
    const res: any = await svc.getCurrent(owner, 1);
    expect(res.data.totals.ingresos).toBe(20000);
  });

  it('lo que NO es efectivo (tarjeta/transferencia) no entra a la caja', async () => {
    const db = buildDb([
      cashSale({ id: 3, totalAmount: 10000 }),
      cashSale({ id: 4, totalAmount: 99999, paymentMethod: 'TARJETA' }),
    ]);
    const svc = await makeSvc(db.prisma);
    const res: any = await svc.getCurrent(owner, 1);
    expect(res.data.totals.ingresos).toBe(10000);
  });

  it('una venta anulada se PURGA de la caja (el arqueo no la cuenta)', async () => {
    const db = buildDb(
      [cashSale({ id: 5, totalAmount: 15000, saleStatus: 'CANCELADA' })],
      [{ cashRegisterId: 50, type: 'INGRESO', amount: 15000, concept: 'Venta en efectivo', saleId: 5 }],
    );
    const svc = await makeSvc(db.prisma);
    const res: any = await svc.getCurrent(owner, 1);
    expect(res.data.totals.ingresos).toBe(0);
    expect(db.read().some((m) => m.saleId === 5)).toBe(false);
  });

  it('si editan el importe de la venta, la caja se corrige (sin duplicar)', async () => {
    const db = buildDb(
      [cashSale({ id: 6, totalAmount: 25000 })], // importe nuevo
      [{ cashRegisterId: 50, type: 'INGRESO', amount: 10000, concept: 'Venta en efectivo', saleId: 6 }], // viejo
    );
    const svc = await makeSvc(db.prisma);
    const res: any = await svc.getCurrent(owner, 1);
    expect(res.data.totals.ingresos).toBe(25000);
    expect(db.read().filter((m) => m.saleId === 6)).toHaveLength(1);
  });

  it('una venta en efectivo de AYER no entra en la caja abierta HOY (cada día su caja)', async () => {
    // 15/11 20:00 Colombia (16/11 01:00Z) → fuera de la ventana de la caja de hoy.
    const db = buildDb([cashSale({ id: 7, totalAmount: 40000, saleDate: new Date('2026-11-15T20:00:00Z') })]);
    const svc = await makeSvc(db.prisma);
    const res: any = await svc.getCurrent(owner, 1);
    expect(res.data.totals.ingresos).toBe(0);
  });
});

// Apertura de caja: al ABRIR la caja de una sede, debe cargar las ventas en
// efectivo del día de ESA sede (la seleccionada). Es el flujo que usa el cliente
// con "exigir abrir caja" activado: registra la venta y, al abrir el día, la caja
// la recoge. "Exigir abrir caja" es editable por empresa (hay clientes que no lo
// usan); esto solo prueba que, cuando se abre, el ingreso queda cargado.
describe('CashService · al ABRIR la caja carga la venta en efectivo de la sede seleccionada', () => {
  const owner = { companyId: 1, id: 9, role: 'SUPER_ADMIN' };
  const OPENED_AT = new Date('2026-11-16T13:00:00Z'); // hoy 08:00 Colombia
  const within = (d: Date, w: any) => (!w?.gte || d >= w.gte) && (!w?.lt || d < w.lt);

  const cashSale = (over: any) => ({
    localId: 1,
    paymentMethod: 'EFECTIVO',
    saleStatus: 'NUEVA',
    paymentStatus: 'PAGADA',
    saleDate: new Date('2026-11-16T14:00:00Z'),
    ...over,
  });

  // Prisma en memoria SIN caja abierta al inicio; open() crea la caja y reconcilia.
  const buildDb = (sales: any[]) => {
    const registers: any[] = [];
    let movements: any[] = [];
    let regSeq = 100;
    let movSeq = 1;
    return {
      movements: () => movements,
      prisma: {
        local: { findFirst: jest.fn(async ({ where }: any) => ({ id: where.id, companyId: 1 })) },
        cashRegister: {
          findFirst: jest.fn(async ({ where }: any) =>
            registers.find((r) => r.localId === where.localId && r.companyId === where.companyId && r.status === where.status) || null,
          ),
          create: jest.fn(async ({ data }: any) => {
            const r = { id: regSeq++, status: 'ABIERTA', openedAt: OPENED_AT, closedAt: null, ...data };
            registers.push(r);
            return r;
          }),
          findUnique: jest.fn(async ({ where, include }: any) => {
            const r = registers.find((x) => x.id === where.id);
            if (!r) return null;
            const out: any = { ...r };
            if (include?.movements) out.movements = movements.filter((m) => m.cashRegisterId === r.id);
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
                within(s.saleDate, where.saleDate),
            );
            if (where.cashMovements?.none) res = res.filter((s) => !movements.some((m) => m.saleId === s.id));
            return res.map((s) => ({ id: s.id, totalAmount: s.totalAmount }));
          }),
        },
        cashMovement: {
          findMany: jest.fn(async ({ where }: any) =>
            movements.filter((m) => m.cashRegisterId === where.cashRegisterId && (!where.concept || m.concept === where.concept)),
          ),
          deleteMany: jest.fn(async ({ where }: any) => {
            const ids = where.id.in;
            const before = movements.length;
            movements = movements.filter((m) => !ids.includes(m.id));
            return { count: before - movements.length };
          }),
          create: jest.fn(async ({ data }: any) => {
            const m = { id: movSeq++, ...data };
            movements.push(m);
            return m;
          }),
        },
        expense: { aggregate: jest.fn(async () => ({ _sum: { amount: 0 } })) },
      },
    };
  };

  const makeSvc = async (prisma: any): Promise<CashService> => {
    const mod = await Test.createTestingModule({
      providers: [CashService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    return mod.get(CashService);
  };

  it('abrir la caja de la sede 1 carga la venta en efectivo de la sede 1 (no la de la 2)', async () => {
    const db = buildDb([
      cashSale({ id: 1, localId: 1, totalAmount: 30000 }),
      cashSale({ id: 2, localId: 2, totalAmount: 50000 }),
    ]);
    const svc = await makeSvc(db.prisma);

    const res: any = await svc.open(owner, { localId: 1, openingAmount: 100000 } as any);

    // A la APERTURA, la caja ya trae la venta en efectivo de SU sede.
    expect(res.data.totals.ingresos).toBe(30000);
    // Esperado = base 100.000 + venta 30.000.
    expect(res.data.totals.expected).toBe(130000);
    // Se creó UN movimiento, por la venta de la sede 1; la de la sede 2 NO entró.
    const movs = db.movements();
    expect(movs).toHaveLength(1);
    expect(movs[0].saleId).toBe(1);
    expect(movs[0].amount).toBe(30000);
    expect(movs.some((m) => m.saleId === 2)).toBe(false);
  });

  it('abrir la caja de la sede 2 carga la venta de la sede 2 (la seleccionada)', async () => {
    const db = buildDb([
      cashSale({ id: 1, localId: 1, totalAmount: 30000 }),
      cashSale({ id: 2, localId: 2, totalAmount: 50000 }),
    ]);
    const svc = await makeSvc(db.prisma);

    const res: any = await svc.open(owner, { localId: 2, openingAmount: 0 } as any);

    expect(res.data.totals.ingresos).toBe(50000);
    const movs = db.movements();
    expect(movs).toHaveLength(1);
    expect(movs[0].saleId).toBe(2);
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
