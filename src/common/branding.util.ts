// Marca a usar en facturas y correos de confirmación.
//
// Regla acordada con el dueño: si la empresa tiene MÁS de una sede, cada local
// usa su propia información (logo, NIT, correo, teléfono, dirección y nombre),
// cayendo a los datos de la empresa cuando el local no tenga ese dato. Con una
// sola sede, se usan SIEMPRE los datos de la empresa registrada.

export interface ResolvedBranding {
  name: string;
  logo: string | null;
  nit: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

interface BrandCompany {
  name?: string | null;
  logo?: string | null;
  nit?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface BrandLocal {
  name?: string | null;
  logo?: string | null;
  nit?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

export function resolveBranding(
  company: BrandCompany | null | undefined,
  local: BrandLocal | null | undefined,
  multiLocal: boolean,
): ResolvedBranding {
  const useLocal = !!(multiLocal && local);
  const pick = (l: any, c: any) => (useLocal ? (l ?? c ?? null) : (c ?? null));
  return {
    name: useLocal
      ? local!.name || company?.name || ''
      : company?.name || '',
    logo: pick(local?.logo, company?.logo),
    nit: pick(local?.nit, company?.nit),
    email: pick(local?.email, company?.email),
    phone: pick(local?.phone, company?.phone),
    address: useLocal ? local?.address ?? null : null,
  };
}
