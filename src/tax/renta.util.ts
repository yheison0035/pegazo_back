// Saldo de renta: impuesto estimado menos lo que ya se pagó por anticipado
// (retenciones que le practicaron al negocio + anticipo del año anterior).
export function rentaBalance(
  impuesto: number | null | undefined,
  retencionesAFavor = 0,
  anticipoRenta = 0,
) {
  if (impuesto == null) return { saldoAPagar: null, saldoAFavor: null };
  const neto =
    Math.round(Number(impuesto) || 0) -
    Math.round(Number(retencionesAFavor) || 0) -
    Math.round(Number(anticipoRenta) || 0);
  return { saldoAPagar: Math.max(0, neto), saldoAFavor: Math.max(0, -neto) };
}
