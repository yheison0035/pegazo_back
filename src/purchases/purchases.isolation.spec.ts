import { Test } from '@nestjs/testing';
import { PurchasesService } from './purchases.service';
import { PrismaService } from '@/prisma.service';

// Aislamiento por local (representativo del lote compras/cotizaciones/
// cuentas por pagar/devoluciones, que comparten el helper assertLocalAccess):
// un rol de sede solo ve/opera lo de su local; el dueño ve todo.
describe('PurchasesService · aislamiento por local', () => {
  const build = (overrides: any = {}) => {
    const prisma: any = {
      local: { findFirst: jest.fn().mockResolvedValue({ id: 2, companyId: 1 }) },
      purchase: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: 50, localId: 1, companyId: 1 }),
      },
      $transaction: jest.fn(async (arr: any[]) => Promise.all(arr)),
      ...overrides,
    };
    return prisma;
  };

  const make = async (prisma: any): Promise<PurchasesService> => {
    const mod = await Test.createTestingModule({
      providers: [PurchasesService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    return mod.get(PurchasesService);
  };

  const cajaLocal2 = { companyId: 1, id: 7, role: 'CAJA', localId: 2 };

  it('un rol de sede solo lista las compras de su local', async () => {
    const prisma = build();
    const svc = await make(prisma);
    await svc.findAll(cajaLocal2, {});
    const where = prisma.purchase.findMany.mock.calls[0][0].where;
    expect(where.localId).toEqual({ in: [2] });
  });

  it('un rol de sede no puede abrir una compra de otro local (403)', async () => {
    const prisma = build(); // la compra 50 es del local 1; el usuario es del 2
    const svc = await make(prisma);
    await expect(svc.findOne(cajaLocal2, 50)).rejects.toThrow(
      'No tienes acceso a este local',
    );
  });

  it('el dueño (SUPER_ADMIN) ve las compras de todos los locales', async () => {
    const prisma = build();
    const svc = await make(prisma);
    await svc.findAll({ companyId: 1, id: 1, role: 'SUPER_ADMIN' }, {});
    const where = prisma.purchase.findMany.mock.calls[0][0].where;
    expect(where.localId).toBeUndefined();
  });

  it('el dueño puede acotar por un local con ?localId', async () => {
    const prisma = build();
    const svc = await make(prisma);
    await svc.findAll({ companyId: 1, id: 1, role: 'SUPER_ADMIN' }, { localId: '3' });
    const where = prisma.purchase.findMany.mock.calls[0][0].where;
    expect(where.localId).toBe(3);
  });
});
