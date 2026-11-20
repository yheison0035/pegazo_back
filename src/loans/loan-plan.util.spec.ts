import {
  addMonthsClamped,
  allocatePayment,
  buildLoanPlan,
  computeMora,
  daysLate,
  effectiveAnnualRate,
  nextDueDate,
  periodicRate,
  resolveInterestRate,
  roundToMultiple,
  summarizeLoan,
} from './loan-plan.util';

// Fechas LOCALES (sin UTC) para que el test no dependa de la zona horaria.
const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);
const ymd = (x: Date) =>
  `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(
    x.getDate(),
  ).padStart(2, '0')}`;
const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

describe('loan-plan.util (motor de préstamos)', () => {
  describe('periodicRate (tasa mensual → periodo)', () => {
    it('convierte proporcionalmente según la frecuencia', () => {
      expect(periodicRate(3, 'MENSUAL')).toBeCloseTo(0.03, 10);
      expect(periodicRate(3, 'DIARIA')).toBeCloseTo(0.001, 10);
      expect(periodicRate(3, 'QUINCENAL')).toBeCloseTo(0.015, 10);
      expect(periodicRate(3, 'SEMANAL')).toBeCloseTo(0.007, 10);
    });
    it('conversión efectiva (compuesta) cuando se pide', () => {
      expect(periodicRate(3, 'QUINCENAL', 'EFECTIVA')).toBeCloseTo(0.014889, 5);
      expect(periodicRate(3, 'MENSUAL', 'EFECTIVA')).toBeCloseTo(0.03, 10);
    });
    it('tasa 0 o negativa → 0', () => {
      expect(periodicRate(0, 'DIARIA')).toBe(0);
      expect(periodicRate(-5, 'MENSUAL')).toBe(0);
    });
  });

  describe('fechas', () => {
    it('addMonthsClamped acota al último día del mes', () => {
      expect(ymd(addMonthsClamped(d(2026, 1, 31), 1))).toBe('2026-02-28');
      expect(ymd(addMonthsClamped(d(2026, 1, 15), 1))).toBe('2026-02-15');
      expect(ymd(addMonthsClamped(d(2026, 3, 31), 1))).toBe('2026-04-30');
    });
    it('nextDueDate por frecuencia', () => {
      const base = d(2026, 1, 10); // sábado
      expect(ymd(nextDueDate(base, 'SEMANAL'))).toBe('2026-01-17');
      expect(ymd(nextDueDate(base, 'QUINCENAL'))).toBe('2026-01-25');
      expect(ymd(nextDueDate(base, 'MENSUAL'))).toBe('2026-02-10');
      expect(ymd(nextDueDate(base, 'DIARIA'))).toBe('2026-01-11');
    });
    it('DIARIA salta los días excluidos (ej. domingo)', () => {
      const sat = d(2026, 1, 10);
      expect(sat.getDay()).toBe(6);
      const next = nextDueDate(sat, 'DIARIA', [0]);
      expect(ymd(next)).toBe('2026-01-12'); // lunes
      expect(next.getDay()).toBe(1);
    });
    it('otras frecuencias corren al siguiente día permitido si caen en excluido', () => {
      // 2026-01-04 es domingo; semanal desde 2025-12-28 (domingo) cae en domingo.
      const base = d(2025, 12, 28);
      expect(ymd(nextDueDate(base, 'SEMANAL', [0]))).toBe('2026-01-05');
    });
  });

  describe('buildLoanPlan · SIMPLE (interés sobre capital, cuota fija)', () => {
    it('1.000.000 al 10% mensual a 10 meses: intereses = capital, cuota 200.000', () => {
      const plan = buildLoanPlan({
        principal: 1_000_000,
        interestRate: 10,
        termCount: 10,
        frequency: 'MENSUAL',
        disbursementDate: d(2026, 1, 5),
      });
      expect(plan.amortization).toBe('SIMPLE');
      expect(plan.totalInterest).toBe(1_000_000);
      expect(plan.totalAmount).toBe(2_000_000);
      expect(plan.installmentAmount).toBe(200_000);
      expect(plan.installments).toHaveLength(10);
      expect(plan.installments.every((i) => i.total === 200_000)).toBe(true);
      expect(plan.installments.every((i) => i.capital === 100_000)).toBe(true);
      expect(plan.installments.every((i) => i.interest === 100_000)).toBe(true);
      expect(ymd(plan.firstDueDate)).toBe('2026-02-05');
      expect(ymd(plan.lastDueDate)).toBe('2026-11-05');
      expect(plan.installments[9].balanceAfter).toBe(0);
      expect(plan.effectiveAnnualRatePercent).toBeCloseTo(213.84, 1);
    });

    it('"paga diario": 1.000.000 al 20% a 30 días sin domingos; sumas exactas', () => {
      const plan = buildLoanPlan({
        principal: 1_000_000,
        interestRate: 20,
        termCount: 30,
        frequency: 'DIARIA',
        disbursementDate: d(2026, 1, 5), // lunes
        excludeWeekdays: [0],
      });
      expect(plan.totalInterest).toBe(200_000);
      expect(plan.totalAmount).toBe(1_200_000);
      expect(plan.installmentAmount).toBe(40_000);
      expect(plan.installments).toHaveLength(30);
      expect(sum(plan.installments.map((i) => i.capital))).toBe(1_000_000);
      expect(sum(plan.installments.map((i) => i.interest))).toBe(200_000);
      expect(sum(plan.installments.map((i) => i.total))).toBe(1_200_000);
      // Ningún vencimiento cae en domingo y las fechas son crecientes.
      expect(plan.installments.some((i) => i.dueDate.getDay() === 0)).toBe(false);
      for (let k = 1; k < plan.installments.length; k++) {
        expect(plan.installments[k].dueDate.getTime()).toBeGreaterThan(
          plan.installments[k - 1].dueDate.getTime(),
        );
      }
      expect(ymd(plan.firstDueDate)).toBe('2026-01-06');
      // Última cuota absorbe el redondeo del capital (33.333 × 29 + 33.343).
      expect(plan.installments[0].capital).toBe(33_333);
      expect(plan.installments[29].capital).toBe(33_343);
      expect(plan.installments[29].total).toBe(40_000);
    });

    it('redondea la cuota al múltiplo pedido y la última cuadra el total', () => {
      const plan = buildLoanPlan({
        principal: 500_000,
        interestRate: 5,
        termCount: 6,
        frequency: 'QUINCENAL',
        roundTo: 1000,
        disbursementDate: d(2026, 1, 1),
      });
      expect(plan.totalInterest).toBe(75_000);
      expect(plan.totalAmount).toBe(575_000);
      const totals = plan.installments.map((i) => i.total);
      expect(totals.slice(0, 5).every((t) => t === 96_000)).toBe(true);
      expect(totals[5]).toBe(95_000);
      expect(sum(totals)).toBe(575_000);
      expect(sum(plan.installments.map((i) => i.capital))).toBe(500_000);
      expect(sum(plan.installments.map((i) => i.interest))).toBe(75_000);
    });

    it('tasa 0: solo capital en cuotas iguales', () => {
      const plan = buildLoanPlan({
        principal: 300_000,
        interestRate: 0,
        termCount: 3,
        frequency: 'MENSUAL',
      });
      expect(plan.totalInterest).toBe(0);
      expect(plan.installments.map((i) => i.total)).toEqual([100_000, 100_000, 100_000]);
      expect(plan.installments.every((i) => i.interest === 0)).toBe(true);
    });

    it('respeta una primera cuota explícita', () => {
      const plan = buildLoanPlan({
        principal: 100_000,
        interestRate: 2,
        termCount: 2,
        frequency: 'MENSUAL',
        disbursementDate: d(2026, 1, 1),
        firstDueDate: d(2026, 3, 15),
      });
      expect(ymd(plan.firstDueDate)).toBe('2026-03-15');
      expect(ymd(plan.installments[1].dueDate)).toBe('2026-04-15');
    });

    it('normaliza entradas inválidas (plazo < 1, capital negativo)', () => {
      const plan = buildLoanPlan({
        principal: -50,
        interestRate: 3,
        termCount: 0,
        frequency: 'MENSUAL',
      });
      expect(plan.principal).toBe(0);
      expect(plan.termCount).toBe(1);
      expect(plan.totalAmount).toBe(0);
    });
  });

  describe('buildLoanPlan · FRANCES (cuota fija, interés sobre saldo)', () => {
    it('1.000.000 al 2% a 12 meses: cuota 94.560, capital crece, cierra en 0', () => {
      const plan = buildLoanPlan({
        principal: 1_000_000,
        interestRate: 2,
        termCount: 12,
        frequency: 'MENSUAL',
        amortization: 'FRANCES',
        disbursementDate: d(2026, 1, 1),
      });
      expect(plan.installmentAmount).toBe(94_560);
      expect(plan.installments[0].interest).toBe(20_000);
      expect(plan.installments[0].capital).toBe(74_560);
      expect(plan.installments[1].interest).toBe(18_509);
      // Todas menos la última son exactamente la cuota fija.
      expect(plan.installments.slice(0, 11).every((i) => i.total === 94_560)).toBe(true);
      expect(sum(plan.installments.map((i) => i.capital))).toBe(1_000_000);
      expect(plan.installments[11].balanceAfter).toBe(0);
      expect(plan.totalAmount).toBe(plan.principal + plan.totalInterest);
      // El capital amortizado crece cuota a cuota.
      for (let k = 1; k < 11; k++) {
        expect(plan.installments[k].capital).toBeGreaterThan(plan.installments[k - 1].capital);
      }
    });
  });

  describe('buildLoanPlan · ALEMAN (capital fijo, cuota decreciente)', () => {
    it('1.200.000 al 3% a 3 meses: capital 400.000 e intereses 36/24/12 mil', () => {
      const plan = buildLoanPlan({
        principal: 1_200_000,
        interestRate: 3,
        termCount: 3,
        frequency: 'MENSUAL',
        amortization: 'ALEMAN',
      });
      expect(plan.installments.map((i) => i.capital)).toEqual([400_000, 400_000, 400_000]);
      expect(plan.installments.map((i) => i.interest)).toEqual([36_000, 24_000, 12_000]);
      expect(plan.installments.map((i) => i.total)).toEqual([436_000, 424_000, 412_000]);
      expect(plan.totalInterest).toBe(72_000);
      expect(plan.totalAmount).toBe(1_272_000);
    });
  });

  describe('mora', () => {
    const due = d(2026, 1, 1);
    it('daysLate cuenta días calendario de atraso (0 si no venció)', () => {
      expect(daysLate(due, d(2026, 1, 11))).toBe(10);
      expect(daysLate(due, d(2026, 1, 1))).toBe(0);
      expect(daysLate(due, d(2025, 12, 20))).toBe(0);
    });
    it('cobra desde el vencimiento una vez superada la gracia', () => {
      expect(
        computeMora({ overdueCapital: 100_000, dueDate: due, now: d(2026, 1, 11), moraRate: 3, graceDays: 3 }),
      ).toBe(1_000); // 100.000 × 0,1% diario × 10 días
    });
    it('dentro de la gracia no hay mora', () => {
      expect(
        computeMora({ overdueCapital: 100_000, dueDate: due, now: d(2026, 1, 3), moraRate: 3, graceDays: 3 }),
      ).toBe(0);
    });
    it('sin gracia, un día de atraso ya genera mora; sin tasa o sin capital no', () => {
      expect(computeMora({ overdueCapital: 100_000, dueDate: due, now: d(2026, 1, 2), moraRate: 3 })).toBe(100);
      expect(computeMora({ overdueCapital: 100_000, dueDate: due, now: d(2026, 1, 20), moraRate: 0 })).toBe(0);
      expect(computeMora({ overdueCapital: 0, dueDate: due, now: d(2026, 1, 20), moraRate: 3 })).toBe(0);
    });
  });

  describe('summarizeLoan + allocatePayment', () => {
    // Préstamo 300.000 al 10% a 3 meses (SIMPLE): 3 cuotas de 110.000.
    const base = () => [
      { id: 1, number: 1, dueDate: d(2026, 1, 10), capital: 100_000, interest: 10_000, capitalPaid: 100_000, interestPaid: 10_000, moraPaid: 0 },
      { id: 2, number: 2, dueDate: d(2026, 2, 10), capital: 100_000, interest: 10_000, capitalPaid: 0, interestPaid: 0, moraPaid: 0 },
      { id: 3, number: 3, dueDate: d(2026, 3, 10), capital: 100_000, interest: 10_000, capitalPaid: 0, interestPaid: 0, moraPaid: 0 },
    ];
    const now = d(2026, 2, 15);

    it('resume estado: cuota 1 pagada, cuota 2 vencida con mora, cuota 3 pendiente', () => {
      const s = summarizeLoan({ installments: base(), moraRate: 3, graceDays: 0, now });
      expect(s.status).toBe('EN_MORA');
      expect(s.installments.map((i) => i.status)).toEqual(['PAGADA', 'VENCIDA', 'PENDIENTE']);
      expect(s.installments[1].daysLate).toBe(5);
      expect(s.installments[1].moraAccrued).toBe(500); // 100.000 × 0,1% × 5
      expect(s.overdueInstallments).toBe(1);
      expect(s.overdueDays).toBe(5);
      expect(s.overdueAmount).toBe(110_500);
      expect(s.pendingCapital).toBe(200_000);
      expect(s.pendingInterest).toBe(20_000);
      expect(s.moraAccrued).toBe(500);
      expect(s.pendingTotal).toBe(220_500);
      expect(s.paidCapital).toBe(100_000);
      expect(s.paidTotal).toBe(110_000);
      expect(ymd(s.nextDueDate as Date)).toBe('2026-02-10');
      expect(s.nextInstallmentAmount).toBe(110_500);
      expect(s.progressPercent).toBe(33);
      expect(s.totalAmount).toBe(330_000);
    });

    it('todo pagado → PAGADO, sin próxima cuota ni mora', () => {
      const all = base().map((i) => ({ ...i, capitalPaid: 100_000, interestPaid: 10_000 }));
      const s = summarizeLoan({ installments: all, moraRate: 3, now });
      expect(s.status).toBe('PAGADO');
      expect(s.pendingTotal).toBe(0);
      expect(s.nextDueDate).toBeNull();
      expect(s.moraAccrued).toBe(0);
      expect(s.progressPercent).toBe(100);
    });

    it('abono parcial antes de vencer → PARCIAL y AL_DIA', () => {
      const inst = base();
      inst[1] = { ...inst[1], capitalPaid: 50_000 };
      const s = summarizeLoan({ installments: inst, moraRate: 3, now: d(2026, 2, 1) });
      expect(s.installments[1].status).toBe('PARCIAL');
      expect(s.status).toBe('AL_DIA');
      expect(s.installments[1].moraAccrued).toBe(0);
    });

    it('la mora ya pagada no se vuelve a cobrar', () => {
      const inst = base();
      inst[1] = { ...inst[1], moraPaid: 300 };
      const s = summarizeLoan({ installments: inst, moraRate: 3, now });
      expect(s.installments[1].moraAccrued).toBe(200);
      expect(s.paidMora).toBe(300);
    });

    it('reparte un abono: mora → interés → capital, cuota más antigua primero', () => {
      const s = summarizeLoan({ installments: base(), moraRate: 3, now });
      const a = allocatePayment({ amount: 50_000, installments: s.installments });
      expect(a.lines).toHaveLength(1);
      expect(a.lines[0]).toMatchObject({ number: 2, mora: 500, interest: 10_000, capital: 39_500, total: 50_000 });
      expect(a.applied).toBe(50_000);
      expect(a.leftover).toBe(0);
    });

    it('un abono grande salda la cuota vencida y sigue con la siguiente', () => {
      const s = summarizeLoan({ installments: base(), moraRate: 3, now });
      const a = allocatePayment({ amount: 120_000, installments: s.installments });
      expect(a.lines.map((l) => l.number)).toEqual([2, 3]);
      expect(a.lines[0].total).toBe(110_500);
      expect(a.lines[1]).toMatchObject({ number: 3, mora: 0, interest: 9_500, capital: 0 });
      expect(a.moraApplied).toBe(500);
      expect(a.interestApplied).toBe(19_500);
      expect(a.capitalApplied).toBe(100_000);
      expect(a.leftover).toBe(0);
    });

    it('lo que sobra por encima de la deuda queda como sobrante', () => {
      const s = summarizeLoan({ installments: base(), moraRate: 3, now });
      const a = allocatePayment({ amount: 1_000_000, installments: s.installments });
      expect(a.applied).toBe(220_500);
      expect(a.leftover).toBe(779_500);
    });

    it('permite abonar primero a una cuota concreta', () => {
      const s = summarizeLoan({ installments: base(), moraRate: 3, now });
      const a = allocatePayment({ amount: 10_000, installments: s.installments, targetNumber: 3 });
      expect(a.lines).toHaveLength(1);
      expect(a.lines[0]).toMatchObject({ number: 3, interest: 10_000, capital: 0 });
    });

    it('respeta un orden de aplicación distinto', () => {
      const s = summarizeLoan({ installments: base(), moraRate: 3, now });
      const a = allocatePayment({
        amount: 50_000,
        installments: s.installments,
        order: ['CAPITAL', 'INTERES', 'MORA'],
      });
      expect(a.lines[0]).toMatchObject({ number: 2, capital: 50_000, interest: 0, mora: 0 });
    });

    it('abono 0 o negativo no asigna nada', () => {
      const s = summarizeLoan({ installments: base(), moraRate: 3, now });
      expect(allocatePayment({ amount: 0, installments: s.installments }).applied).toBe(0);
      expect(allocatePayment({ amount: -10, installments: s.installments }).applied).toBe(0);
    });
  });

  describe('resolveInterestRate (cascada préstamo → cliente → producto → empresa)', () => {
    it('toma la más específica disponible y dice de dónde salió', () => {
      expect(resolveInterestRate({ loanRate: 4, customerRate: 3, productRate: 2, companyRate: 1 })).toEqual({ rate: 4, source: 'LOAN' });
      expect(resolveInterestRate({ customerRate: 3, productRate: 2, companyRate: 1 })).toEqual({ rate: 3, source: 'CUSTOMER' });
      expect(resolveInterestRate({ productRate: 2, companyRate: 1 })).toEqual({ rate: 2, source: 'PRODUCT' });
      expect(resolveInterestRate({ companyRate: 1 })).toEqual({ rate: 1, source: 'COMPANY' });
      expect(resolveInterestRate({})).toEqual({ rate: 0, source: 'NONE' });
    });
    it('null/undefined/"" no cuentan, pero 0 sí es una tasa válida', () => {
      expect(resolveInterestRate({ loanRate: null, customerRate: undefined, productRate: '' as any, companyRate: 1.5 })).toEqual({ rate: 1.5, source: 'COMPANY' });
      expect(resolveInterestRate({ customerRate: 0, companyRate: 5 })).toEqual({ rate: 0, source: 'CUSTOMER' });
    });
  });

  describe('utilidades', () => {
    it('roundToMultiple', () => {
      expect(roundToMultiple(95_833, 1000)).toBe(96_000);
      expect(roundToMultiple(95_400, 1000)).toBe(95_000);
      expect(roundToMultiple(95_833.7)).toBe(95_834);
      expect(roundToMultiple(123, 0)).toBe(123);
    });
    it('effectiveAnnualRate', () => {
      expect(effectiveAnnualRate(0)).toBe(0);
      expect(effectiveAnnualRate(2) * 100).toBeCloseTo(26.82, 1);
    });
  });
});
