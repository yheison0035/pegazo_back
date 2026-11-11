import { addPeriod, buildCreditPlan, summarizeCredit } from './credit-plan.util';

describe('credit-plan.util', () => {
  const saleDate = new Date('2026-01-10T12:00:00.000Z');

  describe('addPeriod', () => {
    it('suma según la frecuencia', () => {
      expect(addPeriod(saleDate, 'SEMANAL', 1).toISOString().slice(0, 10)).toBe(
        '2026-01-17',
      );
      expect(addPeriod(saleDate, 'QUINCENAL', 1).toISOString().slice(0, 10)).toBe(
        '2026-01-25',
      );
      expect(addPeriod(saleDate, 'MENSUAL', 2).toISOString().slice(0, 10)).toBe(
        '2026-03-10',
      );
      expect(addPeriod(saleDate, 'ANUAL', 1).toISOString().slice(0, 10)).toBe(
        '2027-01-10',
      );
    });
  });

  describe('buildCreditPlan', () => {
    it('reparte el total en cuotas iguales y la última absorbe el redondeo', () => {
      const plan = buildCreditPlan({
        total: 100000,
        count: 3,
        frequency: 'MENSUAL',
        saleDate,
      });
      expect(plan.installments).toHaveLength(3);
      const sum = plan.installments.reduce((a, i) => a + i.amount, 0);
      expect(sum).toBe(100000);
      // 100000/3 => 33333, 33333, 33334
      expect(plan.installments.map((i) => i.amount)).toEqual([33333, 33333, 33334]);
    });

    it('descuenta la cuota inicial y aplica el recargo sobre el saldo financiado', () => {
      const plan = buildCreditPlan({
        total: 100000,
        downPayment: 20000,
        interestPercent: 10,
        count: 4,
        frequency: 'QUINCENAL',
        saleDate,
      });
      // financiado = 80000; recargo 10% = 8000; a repartir = 88000
      expect(plan.down).toBe(20000);
      expect(plan.interestAmount).toBe(8000);
      expect(plan.financedTotal).toBe(88000);
      expect(plan.obligation).toBe(108000);
      const sum = plan.installments.reduce((a, i) => a + i.amount, 0);
      expect(sum).toBe(88000);
      expect(plan.installments.map((i) => i.amount)).toEqual([
        22000, 22000, 22000, 22000,
      ]);
    });

    it('primera cuota por defecto un periodo después de la venta', () => {
      const plan = buildCreditPlan({
        total: 90000,
        count: 3,
        frequency: 'MENSUAL',
        saleDate,
      });
      expect(plan.installments[0].dueDate.toISOString().slice(0, 10)).toBe(
        '2026-02-10',
      );
      expect(plan.installments[2].dueDate.toISOString().slice(0, 10)).toBe(
        '2026-04-10',
      );
    });
  });

  describe('summarizeCredit', () => {
    const plan = buildCreditPlan({
      total: 90000,
      count: 3,
      frequency: 'MENSUAL',
      saleDate,
    });
    const installments = plan.installments.map((i) => ({
      number: i.number,
      dueDate: i.dueDate,
      amount: i.amount,
    }));

    it('sin abonos: todo pendiente y la próxima cuota es la primera', () => {
      const s = summarizeCredit({
        obligation: 90000,
        downPayment: 0,
        totalPaid: 0,
        installments,
        now: new Date('2026-01-15T12:00:00.000Z'),
      });
      expect(s.saldo).toBe(90000);
      expect(s.installments[0].status).toBe('PENDIENTE');
      expect(s.nextDueDate?.toISOString().slice(0, 10)).toBe('2026-02-10');
    });

    it('un abono salda la primera cuota y parte de la segunda', () => {
      const s = summarizeCredit({
        obligation: 90000,
        downPayment: 0,
        totalPaid: 40000,
        installments,
        now: new Date('2026-02-15T12:00:00.000Z'),
      });
      expect(s.saldo).toBe(50000);
      expect(s.installments[0].status).toBe('PAGADA');
      expect(s.installments[1].paid).toBe(10000);
      expect(s.installments[1].status).toBe('PARCIAL');
      // la próxima cuota con saldo es la 2
      expect(s.nextDueDate?.toISOString().slice(0, 10)).toBe('2026-03-10');
    });

    it('marca VENCIDA la cuota con saldo cuya fecha ya pasó', () => {
      const s = summarizeCredit({
        obligation: 90000,
        downPayment: 0,
        totalPaid: 0,
        installments,
        now: new Date('2026-03-01T12:00:00.000Z'),
      });
      // la 1ª (2026-02-10) ya venció y sigue con saldo
      expect(s.installments[0].status).toBe('VENCIDA');
      expect(s.overdueDays).toBeGreaterThan(0);
    });
  });
});
