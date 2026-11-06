import { Test } from '@nestjs/testing';
import { RestDaysService } from './rest-days.service';
import { PrismaService } from '@/prisma.service';

// El panel de descansos del calendario de citas muestra el EQUIPO. Debe
// limitarse a los profesionales de los locales accesibles: un administrador solo
// ve los de su local (no los de otra sede); el dueño ve a todos.
describe('RestDaysService.overview · aislamiento por local', () => {
  const make = async (prisma: any): Promise<RestDaysService> => {
    const mod = await Test.createTestingModule({
      providers: [RestDaysService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    return mod.get(RestDaysService);
  };

  const build = () => ({
    local: { findFirst: jest.fn().mockResolvedValue({ id: 2, companyId: 1 }) },
    user: { findMany: jest.fn().mockResolvedValue([]) },
    employeeTimeOff: { findMany: jest.fn().mockResolvedValue([]) },
  });

  it('un administrador solo ve el equipo de su local', async () => {
    const prisma: any = build();
    const svc = await make(prisma);
    await svc.overview({ companyId: 1, id: 7, role: 'ADMIN', localId: 2 });
    const where = prisma.user.findMany.mock.calls[0][0].where;
    expect(where.localId).toEqual({ in: [2] });
  });

  it('el dueño ve a todo el equipo de la empresa', async () => {
    const prisma: any = build();
    const svc = await make(prisma);
    await svc.overview({ companyId: 1, id: 1, role: 'SUPER_ADMIN' });
    const where = prisma.user.findMany.mock.calls[0][0].where;
    expect(where.localId).toBeUndefined();
  });

  // professionals() alimenta la pantalla de Descansos: también debe aislarse.
  it('professionals: un administrador solo ve los de su local', async () => {
    const prisma: any = build();
    const svc = await make(prisma);
    await svc.professionals({ companyId: 1, id: 7, role: 'ADMIN', localId: 2 });
    const where = prisma.user.findMany.mock.calls[0][0].where;
    expect(where.localId).toEqual({ in: [2] });
  });

  it('professionals: el dueño ve a todos', async () => {
    const prisma: any = build();
    const svc = await make(prisma);
    await svc.professionals({ companyId: 1, id: 1, role: 'SUPER_ADMIN' });
    const where = prisma.user.findMany.mock.calls[0][0].where;
    expect(where.localId).toBeUndefined();
  });
});
