import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { ManualEntriesService } from './manual-entries.service';

// Asientos manuales con Prisma simulado: edición completa (respetando cierre
// de periodo) e importación en los dos formatos (PAR y DIARIO).
describe('ManualEntriesService', () => {
  const prisma: any = {
    company: {
      findUnique: jest.fn().mockResolvedValue({ booksClosedUntil: null }),
    },
    ledgerAccount: {
      findMany: jest.fn().mockResolvedValue([
        { code: '1105', name: 'CAJA' },
        { code: '1110', name: 'BANCOS' },
        { code: '2408', name: 'IVA' },
        { code: '3115', name: 'CAPITAL' },
        { code: '4135', name: 'VENTAS' },
        { code: '5120', name: 'ARRIENDO' },
      ]),
    },
    journalEntry: {
      create: jest
        .fn()
        .mockImplementation(({ data }) =>
          Promise.resolve({ id: 1, ...data, lines: data.lines.create }),
        ),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    journalEntryLine: { deleteMany: jest.fn() },
    $transaction: jest.fn(),
  };
  let svc: ManualEntriesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.company.findUnique.mockResolvedValue({ booksClosedUntil: null });
    prisma.$transaction.mockImplementation((fn: any) => fn(prisma));
    prisma.journalEntry.update.mockImplementation(({ data }) =>
      Promise.resolve({ id: 7, ...data, lines: data.lines.create }),
    );
    const mod = await Test.createTestingModule({
      providers: [
        ManualEntriesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    svc = mod.get(ManualEntriesService);
  });

  describe('update', () => {
    const dto = {
      date: '2026-03-10',
      description: 'Ajuste',
      lines: [
        { accountCode: '1105', debit: 1000 },
        { accountCode: '4135', credit: 1000 },
      ],
    };

    it('reemplaza líneas y cabecera en una transacción', async () => {
      prisma.journalEntry.findFirst.mockResolvedValue({
        id: 7,
        companyId: 1,
        date: new Date('2026-03-01'),
      });
      const res = await svc.update(1, 7, dto);
      expect(prisma.journalEntryLine.deleteMany).toHaveBeenCalledWith({
        where: { entryId: 7 },
      });
      expect(prisma.journalEntry.update).toHaveBeenCalledTimes(1);
      const arg = prisma.journalEntry.update.mock.calls[0][0];
      expect(arg.where).toEqual({ id: 7 });
      expect(arg.data.description).toBe('Ajuste');
      expect(arg.data.lines.create).toHaveLength(2);
      expect(res.success).toBe(true);
    });

    it('404 si el asiento no es de la empresa', async () => {
      prisma.journalEntry.findFirst.mockResolvedValue(null);
      await expect(svc.update(1, 99, dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rechaza si la fecha original está en periodo cerrado', async () => {
      prisma.journalEntry.findFirst.mockResolvedValue({
        id: 7,
        companyId: 1,
        date: new Date('2026-01-15'),
      });
      prisma.company.findUnique.mockResolvedValue({
        booksClosedUntil: new Date('2026-01-31'),
      });
      await expect(svc.update(1, 7, dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.journalEntry.update).not.toHaveBeenCalled();
    });

    it('rechaza si el asiento no cuadra', async () => {
      prisma.journalEntry.findFirst.mockResolvedValue({
        id: 7,
        companyId: 1,
        date: new Date('2026-03-01'),
      });
      await expect(
        svc.update(1, 7, {
          ...dto,
          lines: [
            { accountCode: '1105', debit: 1000 },
            { accountCode: '4135', credit: 900 },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('bulkImport', () => {
    it('formato PAR: una fila = un asiento de dos líneas', async () => {
      const res = await svc.bulkImport(1, [
        {
          fecha: '2026-01-05',
          descripcion: 'Venta',
          cuentaDebito: '1105',
          cuentaCredito: '4135',
          valor: '119.000',
        },
        {
          fecha: '2026-01-05',
          descripcion: 'Mal',
          cuentaDebito: '9999',
          cuentaCredito: '4135',
          valor: 10,
        },
      ]);
      expect(res.data.created).toBe(1);
      expect(res.data.errors).toEqual([
        { row: 3, message: 'La cuenta débito 9999 no existe en el PUC.' },
      ]);
      const data = prisma.journalEntry.create.mock.calls[0][0].data;
      expect(data.lines.create).toEqual([
        { accountCode: '1105', accountName: 'CAJA', debit: 119000, credit: 0 },
        {
          accountCode: '4135',
          accountName: 'VENTAS',
          debit: 0,
          credit: 119000,
        },
      ]);
    });

    it('formato DIARIO: agrupa varias filas en un asiento de N líneas', async () => {
      const res = await svc.bulkImport(1, [
        {
          fecha: '2026-01-05',
          descripcion: 'Venta',
          asiento: 1,
          cuenta: '1105',
          debito: 119000,
        },
        {
          fecha: '2026-01-05',
          descripcion: 'Venta',
          asiento: 1,
          cuenta: '4135',
          credito: 100000,
        },
        {
          fecha: '2026-01-05',
          descripcion: 'Venta',
          asiento: 1,
          cuenta: '2408',
          credito: 19000,
        },
        {
          fecha: '2026-01-06',
          descripcion: 'Arriendo',
          asiento: 2,
          cuenta: '5120',
          debito: 500000,
        },
        {
          fecha: '2026-01-06',
          descripcion: 'Arriendo',
          asiento: 2,
          cuenta: '1110',
          credito: 400000,
        },
      ]);
      expect(res.data.total).toBe(5);
      expect(res.data.created).toBe(1);
      expect(res.data.errors).toHaveLength(1);
      expect(res.data.errors[0].row).toBe(5);
      expect(res.data.errors[0].message).toMatch(/Filas 5-6/);
      expect(res.data.errors[0].message).toMatch(/no cuadra/);
      const data = prisma.journalEntry.create.mock.calls[0][0].data;
      expect(data.lines.create).toHaveLength(3);
      expect(data.lines.create[2]).toEqual({
        accountCode: '2408',
        accountName: 'IVA',
        debit: 0,
        credit: 19000,
      });
    });

    it('mezcla de formatos y cuentas inexistentes en DIARIO', async () => {
      const res = await svc.bulkImport(1, [
        {
          fecha: '2026-02-01',
          descripcion: 'Aporte',
          cuentaDebito: '1105',
          cuentaCredito: '3115',
          valor: 5000000,
        },
        {
          fecha: '2026-02-02',
          descripcion: 'X',
          asiento: 'A',
          cuenta: '1105',
          debito: 10,
        },
        {
          fecha: '2026-02-02',
          descripcion: 'X',
          asiento: 'A',
          cuenta: '7777',
          credito: 10,
        },
      ]);
      expect(res.data.created).toBe(1);
      expect(res.data.errors).toEqual([
        { row: 3, message: 'Filas 3-4: Cuenta(s) no existen en el PUC: 7777.' },
      ]);
    });

    it('rechaza archivos vacíos', async () => {
      await expect(svc.bulkImport(1, [])).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
