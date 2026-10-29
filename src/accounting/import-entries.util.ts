// Utilidades puras de la importación de asientos desde Excel/CSV.
//
// Se aceptan dos formatos de fila (pueden venir mezclados en el mismo archivo):
//  - PAR:    fecha, descripcion, cuentaDebito, cuentaCredito, valor, referencia
//            → cada fila es un asiento de dos líneas.
//  - DIARIO: fecha, descripcion, referencia, asiento, cuenta, debito, credito
//            → varias filas forman UN asiento (se agrupan por "asiento"; si la
//            columna no viene, por fecha + descripción + referencia).
export type PairRow = {
  rowNo: number;
  fecha?: unknown;
  descripcion?: unknown;
  referencia?: unknown;
  cuentaDebito?: unknown;
  cuentaCredito?: unknown;
  valor?: unknown;
};
export type JournalRow = {
  rowNo: number;
  fecha?: unknown;
  descripcion?: unknown;
  referencia?: unknown;
  asiento?: unknown;
  cuenta?: unknown;
  debito?: unknown;
  credito?: unknown;
};
export type JournalGroup = {
  key: string;
  rowNos: number[];
  date: string;
  description: string;
  reference: string | null;
  lines: { accountCode: string; debit: number; credit: number }[];
};

// Texto de una celda importada: solo primitivos (y fechas); objetos → ''.
export function cellText(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return '';
}
const clean = cellText;

// Convierte "1.234.567", "1,234,567.50", "$ 250.000" o 250000 a entero COP.
export function parseAmount(v: unknown): number {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return Math.round(v);
  let s = cellText(v).replace(/[^\d.,-]/g, '');
  if (!s) return 0;
  const hasDot = s.includes('.');
  const hasComma = s.includes(',');
  if (hasDot && hasComma) {
    // El último separador es el decimal; el otro, de miles.
    if (s.lastIndexOf(',') > s.lastIndexOf('.'))
      s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (hasComma) {
    // Solo comas: si hay más de una o la parte final tiene 3 dígitos → miles.
    const parts = s.split(',');
    s =
      parts.length > 2 || parts[parts.length - 1].length === 3
        ? parts.join('')
        : parts.join('.');
  } else if (hasDot) {
    const parts = s.split('.');
    s =
      parts.length > 2 || parts[parts.length - 1].length === 3
        ? parts.join('')
        : s;
  }
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

// Una fila es de formato DIARIO si trae "cuenta" (y no las cuentas del par).
export function isJournalRow(r: unknown): boolean {
  if (!r || typeof r !== 'object') return false;
  const o = r as Record<string, unknown>;
  const hasPair = clean(o.cuentaDebito) || clean(o.cuentaCredito);
  return !hasPair && !!clean(o.cuenta);
}

// Agrupa filas DIARIO en asientos. Devuelve los grupos (en el orden de
// aparición) y errores por fila (sin cuenta/valor, etc.).
export function groupJournalRows(rows: JournalRow[]): {
  groups: JournalGroup[];
  errors: { row: number; message: string }[];
} {
  const groups = new Map<string, JournalGroup>();
  const errors: { row: number; message: string }[] = [];
  for (const r of rows) {
    const cuenta = clean(r.cuenta);
    const debit = Math.max(0, parseAmount(r.debito));
    const credit = Math.max(0, parseAmount(r.credito));
    if (!cuenta) {
      errors.push({ row: r.rowNo, message: 'Falta la cuenta.' });
      continue;
    }
    if (!debit && !credit) {
      errors.push({
        row: r.rowNo,
        message: 'La fila no tiene débito ni crédito.',
      });
      continue;
    }
    if (debit && credit) {
      errors.push({
        row: r.rowNo,
        message: 'Una línea no puede tener débito y crédito a la vez.',
      });
      continue;
    }
    const asiento = clean(r.asiento);
    const fecha = clean(r.fecha);
    const descripcion = clean(r.descripcion);
    const referencia = clean(r.referencia);
    const key = asiento
      ? `A:${asiento}`
      : `K:${fecha}|${descripcion}|${referencia}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        key,
        rowNos: [],
        date: fecha,
        description:
          descripcion || (asiento ? `Asiento ${asiento}` : 'Importación'),
        reference: referencia || asiento || null,
        lines: [],
      };
      groups.set(key, g);
    }
    if (!g.date && fecha) g.date = fecha;
    if ((!g.description || g.description.startsWith('Asiento ')) && descripcion)
      g.description = descripcion;
    g.rowNos.push(r.rowNo);
    g.lines.push({ accountCode: cuenta, debit, credit });
  }
  return { groups: Array.from(groups.values()), errors };
}
