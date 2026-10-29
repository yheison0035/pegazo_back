// Utilidades puras para importar el plan de cuentas desde Excel/CSV.
// Acepta etiquetas en español o los códigos internos, e infiere grupo y
// naturaleza desde el código PUC cuando no vienen.
export const ACCOUNT_TYPES = [
  'ASSET',
  'LIABILITY',
  'EQUITY',
  'INCOME',
  'COST',
  'EXPENSE',
] as const;
export const ACCOUNT_NATURES = ['DEBIT', 'CREDIT'] as const;

import { cellText } from '@/accounting/import-entries.util';

const strip = (s: unknown) =>
  cellText(s).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const TYPE_ALIASES: Record<string, string> = {
  ASSET: 'ASSET',
  ACTIVO: 'ASSET',
  ACTIVOS: 'ASSET',
  LIABILITY: 'LIABILITY',
  PASIVO: 'LIABILITY',
  PASIVOS: 'LIABILITY',
  EQUITY: 'EQUITY',
  PATRIMONIO: 'EQUITY',
  INCOME: 'INCOME',
  INGRESO: 'INCOME',
  INGRESOS: 'INCOME',
  COST: 'COST',
  COSTO: 'COST',
  COSTOS: 'COST',
  'COSTO DE VENTAS': 'COST',
  EXPENSE: 'EXPENSE',
  GASTO: 'EXPENSE',
  GASTOS: 'EXPENSE',
};
const NATURE_ALIASES: Record<string, string> = {
  DEBIT: 'DEBIT',
  DEBITO: 'DEBIT',
  DB: 'DEBIT',
  D: 'DEBIT',
  CREDIT: 'CREDIT',
  CREDITO: 'CREDIT',
  CR: 'CREDIT',
  C: 'CREDIT',
};

// Grupo según la clase PUC (primer dígito del código).
export function typeFromCode(code: string): string | null {
  const first = String(code || '').trim()[0];
  switch (first) {
    case '1':
      return 'ASSET';
    case '2':
      return 'LIABILITY';
    case '3':
      return 'EQUITY';
    case '4':
      return 'INCOME';
    case '5':
      return 'EXPENSE';
    case '6':
    case '7':
      return 'COST';
    default:
      return null;
  }
}

export function natureFromType(type: string): string {
  return type === 'ASSET' || type === 'EXPENSE' || type === 'COST'
    ? 'DEBIT'
    : 'CREDIT';
}

export function parseAccountType(v: unknown): string | null {
  const k = strip(v);
  if (!k) return null;
  return TYPE_ALIASES[k] || null;
}

export function parseAccountNature(v: unknown): string | null {
  const k = strip(v);
  if (!k) return null;
  return NATURE_ALIASES[k] || null;
}

export type ParsedAccountRow = {
  code: string;
  name: string;
  type: string;
  nature: string;
};

// Normaliza una fila importada a {code,name,type,nature}; lanza con mensaje
// claro si falta algo o un valor no se reconoce.
export function parseAccountRow(r: unknown): ParsedAccountRow {
  const o = (r && typeof r === 'object' ? r : {}) as Record<string, unknown>;
  const code = cellText(o.code ?? o.codigo);
  const name = cellText(o.name ?? o.nombre ?? o.cuenta).toUpperCase();
  if (!code) throw new Error('Falta el código.');
  if (!/^\d{1,10}$/.test(code))
    throw new Error(`El código "${code}" debe ser numérico (PUC).`);
  if (!name) throw new Error('Falta el nombre.');
  const rawType = o.type ?? o.tipo ?? o.grupo;
  let type = parseAccountType(rawType);
  if (!type && strip(rawType))
    throw new Error(`Grupo "${String(rawType)}" no reconocido.`);
  if (!type) type = typeFromCode(code);
  if (!type)
    throw new Error(
      'No se pudo deducir el grupo (Activo, Pasivo…) del código.',
    );
  const rawNature = o.nature ?? o.naturaleza;
  let nature = parseAccountNature(rawNature);
  if (!nature && strip(rawNature))
    throw new Error(`Naturaleza "${String(rawNature)}" no reconocida.`);
  if (!nature) nature = natureFromType(type);
  return { code, name: name.slice(0, 120), type, nature };
}
