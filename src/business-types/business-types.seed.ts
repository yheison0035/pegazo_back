// Semilla inicial de la configuración de tipos de negocio. Se copia UNA vez a la
// BD (BusinessTypeConfig) desde el mapa que antes vivía solo en el front
// (businessTypes.js). A partir de ahí, la BD es la fuente de verdad y la
// plataforma la edita; esta semilla solo crea las filas que aún no existen.
export const BUSINESS_TYPE_LABELS: Record<string, string> = {
  COMERCIO: 'Comercio',
  FERIA: 'Feria',
  TELEVENTAS: 'Televentas',
  RESTAURANTE: 'Restaurante',
  SERVICIOS: 'Servicios',
  ECOMMERCE: 'Ecommerce',
  DISTRIBUCION: 'Distribución',
  ODONTOLOGIA: 'Odontología',
  SUPERMERCADO: 'Supermercado',
  DROGUERIA: 'Droguería',
  ROPA: 'Ropa',
  CALZADO: 'Calzado',
  FRUVER: 'Fruver',
  FLORISTERIA: 'Floristería',
  COMIDA_RAPIDA: 'Comida rápida',
  CAFETERIA: 'Cafetería',
  CARNICERIA: 'Carnicería',
  LAVADO_VEHICULOS: 'Lavado de vehículos',
  CANCHAS_SINTETICAS: 'Canchas sintéticas',
  GUARDA_CASCOS: 'Guarda cascos',
};

const RETAIL = [
  'locals', 'users', 'categories', 'brands', 'providers', 'inventory',
  'purchases', 'customers', 'cartera', 'impuestos', 'sales', 'delivered_sales',
  'returns', 'cash', 'expenses', 'payables', 'statistics',
];
const PERECEDERO = [
  'locals', 'users', 'categories', 'providers', 'inventory', 'purchases',
  'customers', 'cartera', 'impuestos', 'sales', 'delivered_sales', 'cash',
  'expenses', 'payables', 'statistics',
];
const COMIDA = [
  'locals', 'users', 'categories', 'providers', 'inventory', 'supplies', 'purchases',
  'customers', 'cartera', 'impuestos', 'mesas', 'kitchen', 'sales', 'delivered_sales',
  'cash', 'expenses', 'payables', 'statistics',
];

export const BUSINESS_TYPE_MODULES: Record<string, string[]> = {
  COMERCIO: RETAIL,
  SUPERMERCADO: RETAIL,
  DROGUERIA: RETAIL,
  ROPA: RETAIL,
  CALZADO: RETAIL,
  FRUVER: PERECEDERO,
  CARNICERIA: PERECEDERO,
  CAFETERIA: PERECEDERO,
  FLORISTERIA: [
    'locals', 'users', 'categories', 'providers', 'inventory', 'purchases',
    'customers', 'cartera', 'impuestos', 'quotes', 'sales', 'delivered_sales',
    'cash', 'expenses', 'payables', 'statistics',
  ],
  FERIA: [
    'locals', 'users', 'categories', 'providers', 'inventory', 'purchases', 'customers', 'cartera', 'impuestos',
    'sales', 'delivered_sales', 'returns', 'cash', 'expenses', 'payables', 'statistics',
  ],
  RESTAURANTE: COMIDA,
  COMIDA_RAPIDA: COMIDA,
  SERVICIOS: [
    'locals', 'users', 'categories', 'brands', 'providers', 'inventory',
    'purchases', 'customers', 'cartera', 'impuestos', 'loyalty', 'services', 'appointments',
    'sales', 'delivered_sales', 'cash', 'expenses', 'payables', 'employee-charges', 'statistics',
  ],
  ODONTOLOGIA: [
    'locals', 'users', 'categories', 'providers', 'inventory', 'purchases',
    'customers', 'cartera', 'impuestos', 'loyalty', 'services', 'appointments', 'quotes', 'clinical',
    'sales', 'delivered_sales', 'cash', 'expenses', 'payables', 'employee-charges', 'statistics',
  ],
  TELEVENTAS: [
    'locals', 'users', 'categories', 'brands', 'providers', 'inventory',
    'purchases', 'customers', 'cartera', 'impuestos', 'quotes', 'sales',
    'delivered_sales', 'returns', 'expenses', 'payables', 'statistics',
  ],
  ECOMMERCE: [
    'locals', 'users', 'categories', 'brands', 'providers', 'inventory',
    'purchases', 'customers', 'cartera', 'impuestos', 'sales', 'delivered_sales',
    'returns', 'expenses', 'payables', 'statistics',
  ],
  DISTRIBUCION: [
    'locals', 'users', 'categories', 'brands', 'providers', 'inventory',
    'purchases', 'customers', 'cartera', 'impuestos', 'quotes', 'sales', 'delivered_sales',
    'returns', 'expenses', 'payables', 'statistics',
  ],

  // ---- Servicios con agenda / recurso ----
  // Lavado de vehículos: como SERVICIOS (turnos, comisión al lavador,
  // fidelización) + venta de productos (ceras, ambientadores).
  LAVADO_VEHICULOS: [
    'locals', 'users', 'categories', 'providers', 'inventory', 'purchases',
    'customers', 'cartera', 'impuestos', 'loyalty', 'services', 'appointments',
    'sales', 'delivered_sales', 'cash', 'expenses', 'payables', 'employee-charges', 'statistics',
  ],
  // Canchas sintéticas: cada cancha es un recurso con agenda; reserva por hora.
  // Vende bebidas / alquiler de implementos como productos.
  CANCHAS_SINTETICAS: [
    'locals', 'users', 'categories', 'providers', 'inventory', 'purchases',
    'customers', 'cartera', 'impuestos', 'loyalty', 'memberships', 'services', 'appointments',
    'sales', 'delivered_sales', 'cash', 'expenses', 'payables', 'statistics',
  ],
  // Guarda cascos: TODO desde 'storage' (un solo punto de cobro). Sin 'sales',
  // 'cartera' ni 'services' para no duplicar el cobro.
  GUARDA_CASCOS: [
    'locals', 'users', 'categories', 'providers', 'inventory', 'purchases',
    'customers', 'impuestos', 'loyalty', 'memberships', 'storage',
    'delivered_sales', 'cash', 'expenses', 'payables', 'statistics',
  ],
};
