// Alinea una fecha al DÍA DE COBRO del ciclo mensual: devuelve el primer día con
// ese día-del-mes que caiga EN o DESPUÉS de `base` (en UTC). Así la fecha de
// suscripción (paidUntil) siempre cae en el día de cobro (ej. el 19), y el
// "estado / días restantes" cuadra con el ciclo. Si el día no existe en el mes
// (ej. 31 en febrero), se usa el último día de ese mes.
export function anchorToBillingDay(base: Date, day: number | null | undefined): Date {
  const b = new Date(base.getTime());
  const d = day && day >= 1 && day <= 31 ? Math.floor(day) : b.getUTCDate();

  const y = b.getUTCFullYear();
  const m = b.getUTCMonth();

  const lastThis = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  let cand = new Date(Date.UTC(y, m, Math.min(d, lastThis)));

  // Si el día de cobro de ESTE mes ya pasó respecto a `base`, salta al siguiente.
  if (cand.getTime() < Date.UTC(y, m, b.getUTCDate())) {
    const lastNext = new Date(Date.UTC(y, m + 2, 0)).getUTCDate();
    cand = new Date(Date.UTC(y, m + 1, Math.min(d, lastNext)));
  }
  return cand;
}

// Día de cobro del ciclo: el día de "Cliente desde" (fuente de verdad) o, si no
// hay, el `paymentDay` guardado o, en última instancia, el día de `paidUntil`.
export function billingDayOf(
  startDate: Date | null | undefined,
  paymentDay: number | null | undefined,
  paidUntil?: Date | null,
): number | null {
  if (startDate) return new Date(startDate).getUTCDate();
  if (paymentDay && paymentDay >= 1 && paymentDay <= 31) return paymentDay;
  if (paidUntil) return new Date(paidUntil).getUTCDate();
  return null;
}

// Próxima fecha de pago EFECTIVA: la fecha pagada (paidUntil) alineada al día de
// cobro. Es DINÁMICA: si el día de cobro cambia, la próxima fecha se recalcula
// sin tener que re-registrar el pago. Nunca ACORTA el periodo ya pagado (ancla
// hacia adelante), así el bloqueo nunca cae antes de lo pagado.
export function effectiveNextPayment(
  paidUntil: Date | null | undefined,
  startDate: Date | null | undefined,
  paymentDay: number | null | undefined,
): Date | null {
  if (!paidUntil) return null;
  const day = billingDayOf(startDate, paymentDay, paidUntil);
  return anchorToBillingDay(new Date(paidUntil), day);
}

// Días que faltan (o se pasó, negativo) hasta `date`, por FECHA en zona Colombia.
export function daysUntilColombia(date: Date | null | undefined): number | null {
  if (!date) return null;
  const p = new Date(date);
  const b = Date.UTC(p.getUTCFullYear(), p.getUTCMonth(), p.getUTCDate());
  let todayStr: string;
  try {
    todayStr = new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/Bogota',
    });
  } catch {
    todayStr = new Date().toISOString().slice(0, 10);
  }
  const [ty, tm, td] = todayStr.split('-').map(Number);
  const a = Date.UTC(ty, tm - 1, td);
  return Math.round((b - a) / 86_400_000);
}
