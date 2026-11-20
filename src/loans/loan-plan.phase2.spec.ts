import { buildLoanPlan, reamortizeRemaining, settlementQuote, summarizeLoan } from './loan-plan.util';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);
const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

// Préstamo SIMPLE 1.000.000 al 10% a 10 meses (cuota 200.000), 3 cuotas pagadas.
function loanAlDia(now = d(2026, 4, 1)) {
  const plan = buildLoanPlan({ principal: 1_000_000, interestRate: 10, termCount: 10, frequency: 'MENSUAL', disbursementDate: d(2026, 1, 1) });
  const installments = plan.installments.map((i) => ({
    id: i.number, number: i.number, dueDate: i.dueDate, capital: i.capital, interest: i.interest,
    capitalPaid: i.number <= 3 ? i.capital : 0, interestPaid: i.number <= 3 ? i.interest : 0, moraPaid: 0,
  }));
  return summarizeLoan({ installments, moraRate: 3, now });
}

describe('loan-plan.util · fase 2', () => {
  describe('reamortizeRemaining (abono a capital)', () => {
    it('bajar la cuota: mismas 7 cuotas, capital 700.000 − 300.000 = 400.000 y menos interés', () => {
      const s = loanAlDia();
      const r = reamortizeRemaining({ installments: s.installments, extraCapital: 300_000, mode: 'REDUCE_INSTALLMENT', interestRate: 10, frequency: 'MENSUAL', amortization: 'SIMPLE' });
      expect(r.settled).toBe(false);
      expect(r.remainingCapital).toBe(400_000);
      expect(r.removedNumbers).toEqual([4, 5, 6, 7, 8, 9, 10]);
      expect(r.newInstallments).toHaveLength(7);
      expect(r.newInstallments[0].number).toBe(4);
      expect(r.newInstallments[6].number).toBe(10);
      expect(r.newTermCount).toBe(10);
      expect(sum(r.newInstallments.map((i) => i.capital))).toBe(400_000);
      // Interés: antes 7 × 100.000 = 700.000; ahora 400.000 × 10% × 7 = 280.000.
      expect(r.interestBefore).toBe(700_000);
      expect(r.interestAfter).toBe(280_000);
      expect(r.installmentBefore).toBe(200_000);
      // Cuota nueva: (400.000 + 280.000) / 7 = 97.143
      expect(r.installmentAfter).toBe(97_143);
      // Conserva la fecha de la siguiente cuota.
      expect(new Date(r.newInstallments[0].dueDate).getTime()).toBe(new Date(s.installments[3].dueDate).getTime());
    });

    it('acortar plazo: cuota ≈ la actual y menos cuotas', () => {
      const s = loanAlDia();
      const r = reamortizeRemaining({ installments: s.installments, extraCapital: 300_000, mode: 'REDUCE_TERM', interestRate: 10, frequency: 'MENSUAL', amortization: 'SIMPLE' });
      // 400.000 al 10%: con n cuotas la cuota = 400.000/n + 40.000 ≤ 200.000 → n ≥ 2,5 → 3 cuotas.
      expect(r.newInstallments).toHaveLength(3);
      expect(r.installmentAfter).toBeLessThanOrEqual(200_000);
      expect(r.newTermCount).toBe(6);
      expect(sum(r.newInstallments.map((i) => i.capital))).toBe(400_000);
      expect(r.interestAfter).toBe(120_000); // 400.000 × 10% × 3
    });

    it('si el abono cubre todo el capital pendiente, queda saldado', () => {
      const s = loanAlDia();
      const r = reamortizeRemaining({ installments: s.installments, extraCapital: 700_000, mode: 'REDUCE_TERM', interestRate: 10, frequency: 'MENSUAL', amortization: 'SIMPLE' });
      expect(r.settled).toBe(true);
      expect(r.remainingCapital).toBe(0);
      expect(r.newInstallments).toHaveLength(0);
      expect(r.newTermCount).toBe(3);
    });

    it('funciona con sistema francés (recalcula sobre saldo)', () => {
      const plan = buildLoanPlan({ principal: 1_000_000, interestRate: 2, termCount: 12, frequency: 'MENSUAL', amortization: 'FRANCES', disbursementDate: d(2026, 1, 1) });
      const inst = plan.installments.map((i) => ({ id: i.number, number: i.number, dueDate: i.dueDate, capital: i.capital, interest: i.interest, capitalPaid: i.number <= 2 ? i.capital : 0, interestPaid: i.number <= 2 ? i.interest : 0, moraPaid: 0 }));
      const s = summarizeLoan({ installments: inst, moraRate: 2, now: d(2026, 2, 15) });
      const r = reamortizeRemaining({ installments: s.installments, extraCapital: 200_000, mode: 'REDUCE_INSTALLMENT', interestRate: 2, frequency: 'MENSUAL', amortization: 'FRANCES' });
      expect(r.newInstallments).toHaveLength(10);
      expect(sum(r.newInstallments.map((i) => i.capital))).toBe(r.remainingCapital);
      expect(r.installmentAfter).toBeLessThan(r.installmentBefore);
      expect(r.interestAfter).toBeLessThan(r.interestBefore);
    });
  });

  describe('settlementQuote (liquidación anticipada)', () => {
    it('al día: capital pendiente + interés de la cuota en curso; perdona el resto', () => {
      const s = loanAlDia(); // hoy 1-abr: cuota 4 vence 1-may → en curso
      const q = settlementQuote(s.installments);
      expect(q.capital).toBe(700_000);
      expect(q.interest).toBe(100_000);
      expect(q.mora).toBe(0);
      expect(q.total).toBe(800_000);
      expect(q.forgivenInterest).toBe(600_000);
      expect(q.installmentNumbersDue).toEqual([4]);
    });

    it('en mora: cobra el interés de las vencidas + la en curso + la mora', () => {
      const s = loanAlDia(d(2026, 6, 5)); // cuotas 4 (1-may) y 5 (1-jun) vencidas; 6 en curso
      const q = settlementQuote(s.installments);
      expect(q.installmentNumbersDue).toEqual([4, 5, 6]);
      expect(q.interest).toBe(300_000);
      expect(q.mora).toBeGreaterThan(0);
      expect(q.total).toBe(700_000 + 300_000 + q.mora);
      expect(q.forgivenInterest).toBe(400_000);
    });

    it('todo pagado: cero', () => {
      const s = loanAlDia();
      const all = s.installments.map((i) => ({ ...i, status: 'PAGADA' as const, pendingCapital: 0, pendingInterest: 0, moraAccrued: 0 }));
      const q = settlementQuote(all);
      expect(q.total).toBe(0);
      expect(q.installmentNumbersDue).toEqual([]);
    });
  });
});
