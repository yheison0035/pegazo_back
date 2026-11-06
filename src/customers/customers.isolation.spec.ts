import { Test } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { PrismaService } from '@/prisma.service';
import { AuditService } from '@/audit/audit.service';
import { PlanLimitsService } from '@/common/plan-limits.service';

// Clientes separados por local: un rol de sede solo ve los clientes de su local
// (el cliente guarda su local de registro). El dueño ve todos.
describe('CustomersService · aislamiento por local', () => {
  const make = async (prisma: any): Promise<CustomersService> => {
    const mod = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: PlanLimitsService, useValue: { assertCanCreate: jest.fn() } },
      ],
    }).compile();
    return mod.get(CustomersService);
  };

  const build = () => ({
    local: { findFirst: jest.fn().mockResolvedValue({ id: 2, companyId: 1 }) },
    customer: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
    },
  });

  it('un rol de sede solo lista los clientes de su local', async () => {
    const prisma: any = build();
    const svc = await make(prisma);
    await svc.findAllPaginated(
      { companyId: 1, id: 7, role: 'CAJA', localId: 2 },
      { all: 'true' },
    );
    const where = prisma.customer.findMany.mock.calls[0][0].where;
    expect(where.localId).toEqual({ in: [2] });
  });

  it('el dueño ve los clientes de todos los locales', async () => {
    const prisma: any = build();
    const svc = await make(prisma);
    await svc.findAllPaginated(
      { companyId: 1, id: 1, role: 'SUPER_ADMIN' },
      { all: 'true' },
    );
    const where = prisma.customer.findMany.mock.calls[0][0].where;
    expect(where.localId).toBeUndefined();
  });

  it('el dueño puede acotar por un local con ?localId', async () => {
    const prisma: any = build();
    const svc = await make(prisma);
    await svc.findAllPaginated(
      { companyId: 1, id: 1, role: 'SUPER_ADMIN' },
      { all: 'true', localId: '5' },
    );
    const where = prisma.customer.findMany.mock.calls[0][0].where;
    expect(where.localId).toBe(5);
  });
});
