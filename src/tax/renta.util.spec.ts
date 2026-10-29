import { rentaBalance } from './renta.util';

describe('rentaBalance (impuesto − retenciones a favor − anticipo)', () => {
  it('saldo a pagar cuando el impuesto supera lo adelantado', () => {
    expect(rentaBalance(10_000_000, 2_000_000, 1_000_000)).toEqual({
      saldoAPagar: 7_000_000,
      saldoAFavor: 0,
    });
  });
  it('saldo a favor cuando le retuvieron de más', () => {
    expect(rentaBalance(1_000_000, 2_500_000, 0)).toEqual({
      saldoAPagar: 0,
      saldoAFavor: 1_500_000,
    });
  });
  it('sin impuesto estimado (motor no disponible) no inventa saldo', () => {
    expect(rentaBalance(null, 500, 500)).toEqual({
      saldoAPagar: null,
      saldoAFavor: null,
    });
  });
  it('tolera vacíos y redondea', () => {
    expect(rentaBalance(1000.4, undefined, undefined)).toEqual({
      saldoAPagar: 1000,
      saldoAFavor: 0,
    });
  });
});
