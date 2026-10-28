import { BusinessType } from '@prisma/client';
import { BUSINESS_TYPE_LABELS, BUSINESS_TYPE_MODULES } from './business-types.seed';

// Consistencia entre el enum (tipos base), los módulos de la semilla y las
// etiquetas. Evita que un tipo nazca con menú vacío o sin nombre.
describe('Tipos de negocio: enum ↔ semilla', () => {
  const enumTypes = Object.values(BusinessType) as string[];
  const CORE = ['locals', 'users', 'customers', 'statistics'];

  it('todo tipo del enum tiene módulos definidos', () => {
    const sinModulos = enumTypes.filter((t) => !(BUSINESS_TYPE_MODULES[t]?.length));
    expect(sinModulos).toEqual([]);
  });

  it('todo tipo con módulos tiene etiqueta legible', () => {
    const sinEtiqueta = Object.keys(BUSINESS_TYPE_MODULES).filter((t) => !BUSINESS_TYPE_LABELS[t]);
    expect(sinEtiqueta).toEqual([]);
  });

  it('todo tipo trae los módulos base para operar (sedes, usuarios, clientes, estadísticas)', () => {
    for (const [t, mods] of Object.entries(BUSINESS_TYPE_MODULES)) {
      for (const k of CORE) expect({ tipo: t, modulo: k, ok: mods.includes(k) }).toEqual({ tipo: t, modulo: k, ok: true });
    }
  });

  it('los tipos de cobro único (parking/storage) NO llevan POS de ventas (evita doble cobro)', () => {
    expect(BUSINESS_TYPE_MODULES.PARQUEADERO).not.toContain('sales');
    expect(BUSINESS_TYPE_MODULES.GUARDA_CASCOS).not.toContain('sales');
    expect(BUSINESS_TYPE_MODULES.PARQUEADERO).toContain('parking');
    expect(BUSINESS_TYPE_MODULES.GUARDA_CASCOS).toContain('storage');
  });

  it('DOCUMENTA: tipos que hoy son solo etiqueta (sin enum ni módulos en código)', () => {
    // Si se configura o se retira alguno, esta lista cambia y el test lo avisa.
    const soloEtiqueta = Object.keys(BUSINESS_TYPE_LABELS).filter((t) => !BUSINESS_TYPE_MODULES[t]).sort();
    expect(soloEtiqueta).toEqual([
      'BAR', 'FERRETERIA', 'GIMNASIO', 'LAVANDERIA', 'LICORERA', 'PANADERIA', 'PAPELERIA',
      'PESCADERIA', 'PETSHOP', 'PIZZERIA', 'TALLER_MECANICO', 'TECNOLOGIA', 'VETERINARIA',
    ]);
  });
});
