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
