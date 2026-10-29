import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { AssetsService } from './assets.service';

// Importación de activos con Prisma simulado: cada fila válida crea un activo
// con el costo derivado (cantidad × valor unitario); las inválidas se reportan.
describe('AssetsService.bulkImport', () => {
  const prisma: any = {
    asset: {
      create: jest
        .fn()
        .mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data })),
    },
  };
  let svc: AssetsService;
  const user = { companyId: 7 };

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await Test.createTestingModule({
      providers: [AssetsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    svc = mod.get(AssetsService);
  });

  it('crea los válidos y reporta los inválidos por fila', async () => {
    const res = await svc.bulkImport(user, [
      {
        name: 'Computador',
        category: 'Equipo',
        acquisitionDate: '2026-01-15',
        quantity: 2,
        unitCost: 2500000,
        usefulLifeMonths: 60,
      },
      { name: '', acquisitionDate: '2026-01-15', unitCost: 10 },
      { name: 'Sin fecha', unitCost: 10 },
      { name: 'Fecha mala', acquisitionDate: 'ayer', unitCost: 10 },
      { name: 'Terreno', acquisitionDate: '2025-05-01', cost: 80000000 },
    ]);
    expect(res.data).toMatchObject({ total: 5, created: 2 });
    expect(res.data.errors.map((e) => e.row)).toEqual([3, 4, 5]);
    const first = prisma.asset.create.mock.calls[0][0].data;
    expect(first).toMatchObject({
      companyId: 7,
      name: 'Computador',
      quantity: 2,
      unitCost: 2500000,
      cost: 5000000,
      usefulLifeMonths: 60,
    });
    const second = prisma.asset.create.mock.calls[1][0].data;
    expect(second).toMatchObject({
      cost: 80000000,
      unitCost: 80000000,
      usefulLifeMonths: null,
    });
  });

  it('rechaza archivos vacíos', async () => {
    await expect(svc.bulkImport(user, [])).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
