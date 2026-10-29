import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { LedgerAccountsService } from './ledger-accounts.service';

// Importación del plan de cuentas con Prisma simulado: crea las nuevas,
// renombra las existentes (las base conservan grupo/naturaleza) y reporta
// errores por fila.
describe('LedgerAccountsService.bulkImport', () => {
  const prisma: any = {
    ledgerAccount: {
      count: jest.fn().mockResolvedValue(3),
      createMany: jest.fn(),
      findMany: jest.fn().mockResolvedValue([
        { id: 1, code: '1105', isBase: true },
        { id: 2, code: '4135', isBase: true },
        { id: 3, code: '5199', isBase: false },
      ]),
      update: jest.fn().mockResolvedValue({}),
      create: jest
        .fn()
        .mockImplementation(({ data }) => Promise.resolve({ id: 99, ...data })),
    },
  };
  let svc: LedgerAccountsService;
  const user = { companyId: 1 };

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await Test.createTestingModule({
      providers: [
        LedgerAccountsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    svc = mod.get(LedgerAccountsService);
  });

  it('crea, actualiza y reporta errores sin abortar', async () => {
    const res = await svc.bulkImport(user, [
      {
        codigo: '1105',
        nombre: 'Caja general',
        grupo: 'Pasivo',
        naturaleza: 'Crédito',
      },
      { codigo: '5199', nombre: 'Otros gastos', grupo: 'Gastos' },
      { codigo: '5120', nombre: 'Arriendo' },
      { codigo: '', nombre: 'Sin código' },
      { codigo: '5120', nombre: 'Repetida' },
    ]);
    expect(res.data).toMatchObject({ total: 5, created: 1, updated: 2 });
    expect(res.data.errors).toEqual([
      { row: 5, message: 'Falta el código.' },
      { row: 6, message: 'El código 5120 está repetido en el archivo.' },
    ]);
    // Cuenta base: solo nombre (grupo/naturaleza intactos aunque el archivo diga otra cosa).
    expect(prisma.ledgerAccount.update.mock.calls[0][0]).toEqual({
      where: { id: 1 },
      data: { name: 'CAJA GENERAL', active: true },
    });
    // Cuenta propia: también grupo y naturaleza.
    expect(prisma.ledgerAccount.update.mock.calls[1][0]).toEqual({
      where: { id: 3 },
      data: {
        name: 'OTROS GASTOS',
        type: 'EXPENSE',
        nature: 'DEBIT',
        active: true,
      },
    });
    expect(prisma.ledgerAccount.create.mock.calls[0][0].data).toEqual({
      companyId: 1,
      code: '5120',
      name: 'ARRIENDO',
      type: 'EXPENSE',
      nature: 'DEBIT',
      isBase: false,
      active: true,
    });
  });

  it('rechaza archivos vacíos', async () => {
    await expect(svc.bulkImport(user, [])).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
