import { Test } from '@nestjs/testing';
import { AssetsService } from './assets.service';
import { PrismaService } from '@/prisma.service';

// Contabilidad · Activos por local: un rol de sede solo ve los activos de su
// local; el dueño ve todos y puede acotar con ?localId.
describe('AssetsService · aislamiento por local', () => {
  const make = async (prisma: any): Promise<AssetsService> => {
    const mod = await Test.createTestingModule({
      providers: [AssetsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    return mod.get(AssetsService);
  };

  const build = () => ({
    local: { findFirst: jest.fn().mockResolvedValue({ id: 2, companyId: 1 }) },
    asset: { findMany: jest.fn().mockResolvedValue([]) },
  });

  it('un rol de sede solo lista los activos de su local', async () => {
    const prisma: any = build();
    const svc = await make(prisma);
    await svc.findAll({ companyId: 1, id: 7, role: 'ADMIN', localId: 2 }, {});
    const where = prisma.asset.findMany.mock.calls[0][0].where;
    expect(where.localId).toEqual({ in: [2] });
  });

  it('el dueño ve todos los activos y puede acotar por sede', async () => {
    const prisma: any = build();
    const svc = await make(prisma);
    await svc.findAll({ companyId: 1, id: 1, role: 'SUPER_ADMIN' }, {});
    let where = prisma.asset.findMany.mock.calls[0][0].where;
    expect(where.localId).toBeUndefined();

    await svc.findAll({ companyId: 1, id: 1, role: 'SUPER_ADMIN' }, { localId: '5' });
    where = prisma.asset.findMany.mock.calls[1][0].where;
    expect(where.localId).toBe(5);
  });
});
