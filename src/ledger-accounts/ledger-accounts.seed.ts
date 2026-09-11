// Plan Único de Cuentas SIMPLIFICADO para un negocio pequeño (base de Colombia).
// No es el PUC completo: es un set mínimo y entendible que cubre la operación
// típica (caja, bancos, cartera, inventario, activos, IVA, retención, ingresos,
// costos y gastos). El dueño/contador puede agregar o editar cuentas.
export type SeedAccount = {
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE' | 'COST';
  nature: 'DEBIT' | 'CREDIT';
};

export const PUC_SIMPLIFICADO: SeedAccount[] = [
  // ---- ACTIVO ----
  { code: '1105', name: 'Caja', type: 'ASSET', nature: 'DEBIT' },
  { code: '1110', name: 'Bancos', type: 'ASSET', nature: 'DEBIT' },
  { code: '1305', name: 'Clientes (cartera)', type: 'ASSET', nature: 'DEBIT' },
  { code: '1435', name: 'Inventario de mercancías', type: 'ASSET', nature: 'DEBIT' },
  { code: '1524', name: 'Equipos, muebles y vehículos', type: 'ASSET', nature: 'DEBIT' },
  { code: '1592', name: 'Depreciación acumulada', type: 'ASSET', nature: 'CREDIT' },
  // ---- PASIVO ----
  { code: '2205', name: 'Proveedores', type: 'LIABILITY', nature: 'CREDIT' },
  { code: '2365', name: 'Retención en la fuente por pagar', type: 'LIABILITY', nature: 'CREDIT' },
  { code: '2408', name: 'IVA por pagar', type: 'LIABILITY', nature: 'CREDIT' },
  { code: '2412', name: 'Impuesto de industria y comercio (ICA) por pagar', type: 'LIABILITY', nature: 'CREDIT' },
  // ---- PATRIMONIO ----
  { code: '3115', name: 'Aportes / Capital', type: 'EQUITY', nature: 'CREDIT' },
  { code: '3605', name: 'Utilidad del ejercicio', type: 'EQUITY', nature: 'CREDIT' },
  // ---- INGRESOS ----
  { code: '4135', name: 'Ingresos por ventas', type: 'INCOME', nature: 'CREDIT' },
  { code: '4210', name: 'Otros ingresos', type: 'INCOME', nature: 'CREDIT' },
  { code: '4175', name: 'Devoluciones en ventas', type: 'INCOME', nature: 'DEBIT' },
  // ---- COSTOS ----
  { code: '6135', name: 'Costo de mercancía vendida', type: 'COST', nature: 'DEBIT' },
  // ---- GASTOS ----
  { code: '5105', name: 'Gastos de administración', type: 'EXPENSE', nature: 'DEBIT' },
  { code: '5205', name: 'Gastos de ventas', type: 'EXPENSE', nature: 'DEBIT' },
  { code: '5160', name: 'Gasto por depreciación', type: 'EXPENSE', nature: 'DEBIT' },
];

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  ASSET: 'Activo',
  LIABILITY: 'Pasivo',
  EQUITY: 'Patrimonio',
  INCOME: 'Ingresos',
  COST: 'Costos',
  EXPENSE: 'Gastos',
};
