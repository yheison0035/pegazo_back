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
