import { Test } from '@nestjs/testing';
import { PrismaService } from '@/prisma.service';
import { PUC_SIMPLIFICADO } from '@/ledger-accounts/ledger-accounts.seed';
import { AccountingService } from './accounting.service';

// Motor de asientos (partida doble derivada) con Prisma simulado. Fase 1
// contabilidad: compras al inventario con IVA descontable, costo de ventas al
// costo registrado del producto, gastos por su medio de pago y pagos a
// proveedor contra 2205 (sin doble conteo). Todo debe cuadrar.
describe('AccountingService.buildEntries', () => {
  const D = (s: string) => new Date(s);
  const prisma: any = {
    ledgerAccount: {
      findMany: jest.fn().mockResolvedValue(PUC_SIMPLIFICADO.map((a: any) => ({ ...a }))),
      createMany: jest.fn(),
    },
    sale: { findMany: jest.fn() },
    salePayment: { findMany: jest.fn().mockResolvedValue([]) },
    expense: { findMany: jest.fn() },
    membershipPayment: { findMany: jest.fn().mockResolvedValue([]) },
    return: { findMany: jest.fn().mockResolvedValue([]) },
    asset: { findMany: jest.fn().mockResolvedValue([]) },
    purchase: { findMany: jest.fn() },
    journalEntry: { findMany: jest.fn().mockResolvedValue([]) },
  };
  let svc: AccountingService;

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.ledgerAccount.findMany.mockResolvedValue(PUC_SIMPLIFICADO.map((a: any) => ({ ...a })));
    const mod = await Test.createTestingModule({
      providers: [AccountingService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    svc = mod.get(AccountingService);
    jest.spyOn(svc as any, 'range').mockReturnValue({
      startStr: '2026-01-01', endStr: '2026-12-31',
      start: D('2026-01-01'), end: D('2027-01-01'),
      startMinus1: D('2025-12-31'), endInclusive: D('2026-12-31'),
    });
    prisma.sale.findMany.mockResolvedValue([
      {
        code: 'V-1', saleDate: D('2026-03-10'), totalAmount: 119000, taxTotal: 19000,
        paymentMethod: 'EFECTIVO', paymentStatus: 'PAGADA', customer: { name: 'Ana' },
        items: [
          { quantity: 2, serviceId: null, variant: { inventory: { purchasePrice: 30000, trackStock: true } } },
          { quantity: 1, serviceId: 7, variant: null }, // servicio: sin costo
          { quantity: 3, serviceId: null, variant: { inventory: { purchasePrice: 5000, trackStock: false } } }, // elaborado: sin costo
        ],
      },
    ]);
    prisma.expense.findMany.mockResolvedValue([
      { concept: 'Arriendo', amount: 20000, expenseDate: D('2026-03-01'), type: 'ARRIENDO', paymentMethod: 'EFECTIVO' },
      { concept: 'Pago proveedor X', amount: 50000, expenseDate: D('2026-03-15'), type: 'PEDIDOS', paymentMethod: 'TRANSFERENCIA' },
      { concept: 'Internet', amount: 9000, expenseDate: D('2026-03-20'), type: 'PLAN_INTERNET', paymentMethod: 'DATAFONO' },
    ]);
    prisma.purchase.findMany.mockResolvedValue([
      { code: 'C-1', subtotal: '100000', taxTotal: '19000', total: 119000, receivedAt: D('2026-03-05'), provider: { name: 'Distrimax' } },
    ]);
  });

  // buildEntries devuelve { entries, map, range }; aquí solo importan los asientos.
  const build = async (): Promise<any[]> => (await (svc as any).buildEntries(1, {})).entries;
  const byType = (entries: any[], t: string) => entries.filter((e) => e.type === t);
  const lineOf = (e: any, code: string) => e.lines.find((l: any) => l.code === code);

  it('todos los asientos cuadran (débitos = créditos)', async () => {
    const entries = await build();
    expect(entries.length).toBeGreaterThan(0);
    for (const e of entries) {
      const d = e.lines.reduce((a: number, l: any) => a + l.debit, 0);
      const c = e.lines.reduce((a: number, l: any) => a + l.credit, 0);
      expect({ type: e.type, d, c }).toEqual({ type: e.type, d: c, c });
    }
  });

  it('venta de contado: Caja 119.000 / Ingresos 100.000 + IVA 19.000', async () => {
    const [v] = byType(await build(), 'VENTA');
    expect(lineOf(v, '1105')).toMatchObject({ debit: 119000, credit: 0 });
    expect(lineOf(v, '4135')).toMatchObject({ debit: 0, credit: 100000 });
    expect(lineOf(v, '2408')).toMatchObject({ debit: 0, credit: 19000 });
  });

  it('costo de ventas = cantidad × costo registrado, solo productos con stock (servicios y elaborados no)', async () => {
    const [c] = byType(await build(), 'COSTO');
    expect(lineOf(c, '6135')).toMatchObject({ debit: 60000, credit: 0 });
    expect(lineOf(c, '1435')).toMatchObject({ debit: 0, credit: 60000 });
  });

  it('compra recibida: Inventario base + IVA descontable (débito 2408) / Proveedores total', async () => {
    const [c] = byType(await build(), 'COMPRA');
    expect(c.date).toBe('2026-03-05');
    expect(lineOf(c, '1435')).toMatchObject({ debit: 100000 });
    expect(lineOf(c, '2408')).toMatchObject({ debit: 19000 });
    expect(lineOf(c, '2205')).toMatchObject({ credit: 119000 });
  });

  it('gastos salen por su medio de pago (efectivo→Caja, banco/datáfono→Bancos)', async () => {
    const g = byType(await build(), 'GASTO');
    expect(g).toHaveLength(2);
    expect(lineOf(g[0], '1105')).toMatchObject({ credit: 20000 });
    expect(lineOf(g[1], '1110')).toMatchObject({ credit: 9000 });
    expect(lineOf(g[0], '5105')).toMatchObject({ debit: 20000 });
  });

  it('pago a proveedor por mercancía (PEDIDOS) baja Proveedores, NO es gasto (sin doble conteo)', async () => {
    const entries = await build();
    const [p] = byType(entries, 'PAGO_PROVEEDOR');
    expect(lineOf(p, '2205')).toMatchObject({ debit: 50000 });
    expect(lineOf(p, '1110')).toMatchObject({ credit: 50000 });
    expect(p.lines.find((l: any) => l.code === '5105')).toBeUndefined();
    // El IVA en libros queda NETO: 19.000 generado − 19.000 descontable = 0
    const iva = entries.flatMap((e) => e.lines).filter((l: any) => l.code === '2408');
    expect(iva.reduce((a: number, l: any) => a + l.credit - l.debit, 0)).toBe(0);
  });

  it('compra sin IVA y venta sin ítems no rompen', async () => {
    prisma.purchase.findMany.mockResolvedValue([{ code: 'C-2', subtotal: null, taxTotal: '0', total: 40000, receivedAt: D('2026-04-01'), provider: null }]);
    prisma.sale.findMany.mockResolvedValue([{ code: 'V-2', saleDate: D('2026-04-02'), totalAmount: 10000, taxTotal: 0, paymentMethod: 'TRANSFERENCIA', paymentStatus: 'PAGADA', customer: null, items: [] }]);
    const entries = await build();
    const [c] = byType(entries, 'COMPRA');
    expect(lineOf(c, '1435')).toMatchObject({ debit: 40000 });
    expect(c.lines.find((l: any) => l.code === '2408')).toBeUndefined();
    expect(byType(entries, 'COSTO')).toHaveLength(0);
    expect(lineOf(byType(entries, 'VENTA')[0], '1110')).toMatchObject({ debit: 10000 });
  });
});
