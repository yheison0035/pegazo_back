import { Test } from '@nestjs/testing';
import { EmployeeChargesService } from './employee-charges.service';
import { PrismaService } from '@/prisma.service';

// Aislamiento por local: los cobros a empleados se acotan por el local del
// empleado. Un administrador ve solo los de los empleados de SU local.
describe('EmployeeChargesService · aislamiento por local', () => {
  const make = async (prisma: any): Promise<EmployeeChargesService> => {
    const mod = await Test.createTestingModule({
      providers: [
        EmployeeChargesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    return mod.get(EmployeeChargesService);
  };

  it('un administrador solo ve cobros de empleados de su local', async () => {
    const prisma: any = {
      // getAccessibleLocalIds(ADMIN localId 2) → [2]
      local: { findFirst: jest.fn().mockResolvedValue({ id: 2, companyId: 1 }) },
      user: {
        // empleados del local 2
        findMany: jest.fn().mockResolvedValue([{ id: 50, name: 'Empleado' }]),
      },
      employeeCharge: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const svc = await make(prisma);
    await svc.findAll({ companyId: 1, id: 7, role: 'ADMIN', localId: 2 }, {});
    const where = prisma.employeeCharge.findMany.mock.calls[0][0].where;
    expect(where.userId).toEqual({ in: [50] });
  });

  it('no se puede crear un cobro a un empleado de otro local (403)', async () => {
    const prisma: any = {
      local: { findFirst: jest.fn().mockResolvedValue({ id: 2, companyId: 1 }) },
      user: {
        // el empleado 5 pertenece al local 9 (no accesible para el admin del 2)
        findFirst: jest.fn().mockResolvedValue({ id: 5, localId: 9 }),
      },
      employeeCharge: { create: jest.fn() },
    };
    const svc = await make(prisma);
    await expect(
      svc.create(
        { userId: 5, concept: 'Adelanto', amount: 1000 } as any,
        { companyId: 1, id: 7, role: 'ADMIN', localId: 2 },
      ),
    ).rejects.toThrow('No tienes acceso a este empleado');
    expect(prisma.employeeCharge.create).not.toHaveBeenCalled();
  });
});
