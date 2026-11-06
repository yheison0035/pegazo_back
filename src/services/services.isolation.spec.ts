import { Test } from '@nestjs/testing';
import { ServicesService } from './services.service';
import { PrismaService } from '@/prisma.service';
import { AuditService } from '@/audit/audit.service';
import { PlanLimitsService } from '@/common/plan-limits.service';

// Aislamiento por local en servicios: el ?localId del cliente NO debe pisar el
// filtro de locales accesibles. Un rol de sede solo ve servicios de su local.
describe('ServicesService · aislamiento por local', () => {
  const make = async (prisma: any): Promise<ServicesService> => {
    const mod = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: AuditService,
          useValue: { log: jest.fn(), latestFor: jest.fn().mockResolvedValue({}) },
        },
        { provide: PlanLimitsService, useValue: { assertModule: jest.fn() } },
      ],
    }).compile();
    return mod.get(ServicesService);
  };

  const build = () => ({
    // El usuario (ADMIN) está asignado al local 2 → solo ve el 2.
    local: { findFirst: jest.fn().mockResolvedValue({ id: 2, companyId: 1 }) },
    service: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    $transaction: jest.fn(async (arr: any[]) => Promise.all(arr)),
  });

  const adminLocal2 = { companyId: 1, id: 7, role: 'ADMIN', localId: 2 };

  it('pedir ?localId de OTRO local no amplía el acceso (no se ven servicios)', async () => {
    const prisma: any = build();
    const svc = await make(prisma);
    // El admin del local 2 intenta ver los servicios del local 1.
    await svc.findAllPaginated(adminLocal2, { localId: '1' });
    const where = prisma.service.findMany.mock.calls[0][0].where;
    // Se bloquea el resultado (id:-1) y NO queda apuntando al local 1.
    expect(where.id).toBe(-1);
    expect(where.serviceLocals).not.toEqual({ some: { localId: 1 } });
  });

  it('su propio local sí se puede filtrar', async () => {
    const prisma: any = build();
    const svc = await make(prisma);
    await svc.findAllPaginated(adminLocal2, { localId: '2' });
    const where = prisma.service.findMany.mock.calls[0][0].where;
    expect(where.serviceLocals).toEqual({ some: { localId: 2 } });
  });

  it('el dueño puede filtrar por cualquier local de su empresa', async () => {
    const prisma: any = build();
    const svc = await make(prisma);
    await svc.findAllPaginated(
      { companyId: 1, id: 1, role: 'SUPER_ADMIN' },
      { localId: '9' },
    );
    const where = prisma.service.findMany.mock.calls[0][0].where;
    expect(where.serviceLocals).toEqual({ some: { localId: 9 } });
  });
});
