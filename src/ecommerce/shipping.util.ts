// Cotización de envío de la tienda online. Fuente de verdad del COSTO y el TIEMPO
// de entrega según el destino (departamento). El backend SIEMPRE recalcula esto
// al crear el pedido (no confía en el valor que manda el front).
//
// Config en Company.storeShipping.carriers[]:
//   {
//     id, name, logo?, enabled, cod,               // cod = contra entrega
//     national: { cost, days },                     // tarifa por defecto (todo el país)
//     overrides: [{ department, cost, days }]       // tarifas por departamento
//   }
// Umbral de envío gratis: storeShipping.freeFrom (o legado shipping.freeFrom).

export interface ShippingOption {
  carrierId: string;
  name: string;
  logo: string | null;
  cod: boolean;
  cost: number;
  days: string | null;
  free: boolean;
}

export function normText(s?: string | null): string {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

function resolveFreeFrom(storeShipping: any): number | null {
  const v = storeShipping?.freeFrom ?? storeShipping?.shipping?.freeFrom ?? null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Modos que NO cobran envío (recoger / consumo en el sitio).
export function isNoChargeMode(method?: string | null): boolean {
  return method === 'pickup' || method === 'dine_in';
}

/**
 * Opciones de envío para un destino (departamento) y subtotal.
 * - Nacional por defecto + overrides por departamento.
 * - Si el subtotal alcanza el umbral de envío gratis, el costo es 0 (free=true).
 * - Si no hay transportadoras configuradas, cae al esquema antiguo (shipping.fee)
 *   como una sola opción "Envío" (retrocompatibilidad).
 */
export function quoteShipping(
  storeShipping: any,
  department: string | null | undefined,
  subtotal: number,
  carrierId?: string | null,
): ShippingOption[] {
  const freeFrom = resolveFreeFrom(storeShipping);
  const free = freeFrom != null && subtotal >= freeFrom;
  const dep = normText(department);

  const carriers: any[] = Array.isArray(storeShipping?.carriers)
    ? storeShipping.carriers
    : [];
  const enabled = carriers.filter((c) => c && c.enabled !== false);

  if (enabled.length) {
    let opts: ShippingOption[] = enabled.map((c) => {
      const override =
        dep && Array.isArray(c.overrides)
          ? c.overrides.find((o: any) => normText(o.department) === dep)
          : null;
      const base = override || c.national || {};
      const rawCost = Math.max(0, Number(base.cost) || 0);
      return {
        carrierId: String(c.id || normText(c.name) || 'transportadora'),
        name: c.name || 'Transportadora',
        logo: c.logo || null,
        cod: c.cod !== false,
        cost: free ? 0 : rawCost,
        days: base.days || c.national?.days || null,
        free,
      };
    });
    if (carrierId) {
      const only = opts.filter((o) => o.carrierId === carrierId);
      if (only.length) opts = only;
    }
    opts.sort((a, b) => a.cost - b.cost);
    return opts;
  }

  // Retrocompatibilidad: esquema antiguo (una sola tarifa "Envío").
  const legacyFee = Math.max(0, Number(storeShipping?.shipping?.fee) || 0);
  return [
    {
      carrierId: 'envio',
      name: 'Envío',
      logo: null,
      cod: true,
      cost: free ? 0 : legacyFee,
      days: null,
      free,
    },
  ];
}

// Elige la opción a cobrar: la del carrierId pedido, o la más barata.
export function pickOption(
  options: ShippingOption[],
  carrierId?: string | null,
): ShippingOption | null {
  if (!options.length) return null;
  if (carrierId) {
    const found = options.find((o) => o.carrierId === carrierId);
    if (found) return found;
  }
  return options[0];
}
