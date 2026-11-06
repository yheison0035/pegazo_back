import { getAccessibleLocalIds } from './access-locals.util';

// Aislamiento de datos por local (multi-sede). El dueño (SUPER_ADMIN) ve todos
// los locales de su empresa; un ADMIN ve SOLO el local que tiene asignado y
// nunca otro, aunque figure como manager de otras sedes.
describe('getAccessibleLocalIds', () => {
  const makePrisma = (over: any = {}) => ({
    local: {
      findFirst: jest.fn().mockResolvedValue({ id: 5 }),
      findMany: jest.fn().mockResolvedValue([]),
      ...over.local,
    },
  });

  it('SUPER_PLATFORM_ADMIN ve todo (null)', async () => {
    const res = await getAccessibleLocalIds(makePrisma() as any, {
      role: 'SUPER_PLATFORM_ADMIN',
    });
    expect(res).toBeNull();
  });

  it('el dueño (SUPER_ADMIN) ve todos los locales de su empresa (null)', async () => {
    const res = await getAccessibleLocalIds(makePrisma() as any, {
      role: 'SUPER_ADMIN',
      companyId: 1,
    });
    expect(res).toBeNull();
  });

  it('ADMIN con local asignado ve EXCLUSIVAMENTE ese local', async () => {
    const prisma = makePrisma({
      local: { findFirst: jest.fn().mockResolvedValue({ id: 5 }) },
    });
    const res = await getAccessibleLocalIds(prisma as any, {
      role: 'ADMIN',
      id: 9,
      companyId: 1,
      localId: 5,
    });
    expect(res).toEqual([5]);
    // No mira los locales que administra como manager: su local asignado manda.
    expect(prisma.local.findMany).not.toHaveBeenCalled();
  });

  it('ADMIN cuyo local asignado no es de su empresa no ve nada', async () => {
    const prisma = makePrisma({
      local: { findFirst: jest.fn().mockResolvedValue(null) },
    });
    const res = await getAccessibleLocalIds(prisma as any, {
      role: 'ADMIN',
      id: 9,
      companyId: 1,
      localId: 99,
    });
    expect(res).toEqual([]);
  });

  it('ADMIN sin local asignado cae a los locales que administra (compat)', async () => {
    const prisma = makePrisma({
      local: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([{ id: 7 }, { id: 8 }]),
      },
    });
    const res = await getAccessibleLocalIds(prisma as any, {
      role: 'ADMIN',
      id: 9,
      companyId: 1,
      localId: null,
    });
    expect(res).toEqual([7, 8]);
  });

  it('un rol de sede ve solo su local asignado', async () => {
    const prisma = makePrisma({
      local: { findFirst: jest.fn().mockResolvedValue({ id: 3 }) },
    });
    const res = await getAccessibleLocalIds(prisma as any, {
      role: 'ASESOR',
      companyId: 1,
      localId: 3,
    });
    expect(res).toEqual([3]);
  });

  it('sin rol global y sin local asignado no ve nada', async () => {
    const res = await getAccessibleLocalIds(makePrisma() as any, {
      role: 'ASESOR',
      companyId: 1,
      localId: null,
    });
    expect(res).toEqual([]);
  });
});
