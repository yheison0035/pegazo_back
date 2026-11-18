import {
  anchorToBillingDay,
  effectiveNextPayment,
  daysUntilColombia,
} from './billing-date.util';

const ymd = (d: Date) => d.toISOString().slice(0, 10);

// La fecha de suscripción (paidUntil) debe caer SIEMPRE en el día de cobro del
// ciclo, para que "estado / días restantes" cuadre con ese día (ej. el 19).
describe('anchorToBillingDay', () => {
  it('si la fecha es ANTES del día de cobro del mes, ancla a ese día del mismo mes', () => {
    // 11/12 con día de cobro 19 → 19/12.
    expect(ymd(anchorToBillingDay(new Date('2026-12-11T00:00:00Z'), 19))).toBe('2026-12-19');
  });

  it('si la fecha ya pasó el día de cobro, salta al día de cobro del mes siguiente', () => {
    // 22/12 con día 19 → 19/01 del año siguiente.
    expect(ymd(anchorToBillingDay(new Date('2026-12-22T00:00:00Z'), 19))).toBe('2027-01-19');
  });

  it('si la fecha ya ES el día de cobro, la respeta', () => {
    expect(ymd(anchorToBillingDay(new Date('2026-12-19T00:00:00Z'), 19))).toBe('2026-12-19');
  });

  it('si el día de cobro no existe en el mes, usa el último día del mes', () => {
    // Día 31 en febrero (2027) → 28/02.
    expect(ymd(anchorToBillingDay(new Date('2027-02-10T00:00:00Z'), 31))).toBe('2027-02-28');
  });

  it('sin día de cobro válido, conserva el día de la fecha base', () => {
    expect(ymd(anchorToBillingDay(new Date('2026-12-11T00:00:00Z'), null))).toBe('2026-12-11');
  });
});

// Próxima fecha EFECTIVA: la fecha pagada alineada al día de cobro. Caso real:
// se registró el pago cuando el día era 11 (paidUntil=11/12) y luego se cambió el
// ciclo al 19 → la próxima fecha debe mostrarse como 19/12 SIN re-registrar.
describe('effectiveNextPayment · dinámico por día de cobro', () => {
  it('alinea paidUntil al día de "Cliente desde" (divas: 11/12 con día 19 → 19/12)', () => {
    const r = effectiveNextPayment(
      new Date('2026-12-11T00:00:00Z'),
      new Date('2026-11-19T00:00:00Z'), // Cliente desde día 19
      11, // paymentDay viejo: NO manda, manda el día de Cliente desde
    );
    expect(ymd(r as Date)).toBe('2026-12-19');
  });

  it('si no hay "Cliente desde", usa el paymentDay', () => {
    const r = effectiveNextPayment(new Date('2026-12-11T00:00:00Z'), null, 19);
    expect(ymd(r as Date)).toBe('2026-12-19');
  });

  it('sin fecha pagada → null', () => {
    expect(effectiveNextPayment(null, new Date('2026-11-19T00:00:00Z'), 19)).toBeNull();
  });

  it('si ya está alineada al día de cobro, no cambia', () => {
    const r = effectiveNextPayment(
      new Date('2026-12-19T00:00:00Z'),
      new Date('2026-11-19T00:00:00Z'),
      19,
    );
    expect(ymd(r as Date)).toBe('2026-12-19');
  });
});

describe('daysUntilColombia', () => {
  it('fecha muy futura es positiva; fecha pasada es negativa; null → null', () => {
    expect(daysUntilColombia(new Date('2999-01-01T00:00:00Z'))).toBeGreaterThan(0);
    expect(daysUntilColombia(new Date('2000-01-01T00:00:00Z'))).toBeLessThan(0);
    expect(daysUntilColombia(null)).toBeNull();
  });
});
