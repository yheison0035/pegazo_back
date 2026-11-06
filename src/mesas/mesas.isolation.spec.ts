import { Test } from '@nestjs/testing';
import { MesasService } from './mesas.service';
import { PrismaService } from '@/prisma.service';

// Aislamiento por local (representativo del lote membresías/parqueadero/
// comandas/mesas): un rol de sede solo ve/crea en su local; el dueño, en todos.
describe('MesasService · aislamiento por local', () => {
  const make = async (prisma: any): Promise<MesasService> => {
    const mod = await Test.createTestingModule({
      providers: [MesasService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    return mod.get(MesasService);
  };

  const build = () => ({
    local: { findFirst: jest.fn().mockResolvedValue({ id: 2, companyId: 1 }) },
    mesa: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 1 }),
    },
  });

  const cajaLocal2 = { companyId: 1, id: 7, role: 'CAJA', localId: 2 };

  it('un rol de sede solo lista las mesas de su local', async () => {
    const prisma: any = build();
    const svc = await make(prisma);
    await svc.findAll(cajaLocal2);
    const where = prisma.mesa.findMany.mock.calls[0][0].where;
    expect(where.localId).toEqual({ in: [2] });
  });

  it('un rol de sede no puede crear una mesa en otro local (403)', async () => {
    const prisma: any = build();
    const svc = await make(prisma);
    await expect(
      svc.create({ name: 'Mesa 1', localId: 1 }, cajaLocal2),
    ).rejects.toThrow('No tienes acceso a este local');
    expect(prisma.mesa.create).not.toHaveBeenCalled();
  });

  it('el dueño ve todas las mesas de su empresa', async () => {
    const prisma: any = build();
    const svc = await make(prisma);
    await svc.findAll({ companyId: 1, id: 1, role: 'SUPER_ADMIN' });
    const where = prisma.mesa.findMany.mock.calls[0][0].where;
    expect(where.localId).toBeUndefined();
  });
});
