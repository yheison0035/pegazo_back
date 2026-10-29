import { BUSINESS_TYPE_MODULES } from '@/business-types/business-types.seed';

// Módulos EFECTIVOS de una empresa, con la MISMA prioridad que el menú del
// front (useNavigation / appointmentsAccess): control manual por empresa →
// configuración del tipo en BD → mapa por defecto del código → COMERCIO.
export function resolveEffectiveModules(input: {
  enabledModules?: string[] | null;
  typeModules?: string[] | null;
  type?: string | null;
}): string[] {
  const manual = input.enabledModules;
  if (Array.isArray(manual) && manual.length) return manual;
  const fromDb = input.typeModules;
  if (Array.isArray(fromDb) && fromDb.length) return fromDb;
  const type = String(input.type || '').toUpperCase();
  return BUSINESS_TYPE_MODULES[type] || BUSINESS_TYPE_MODULES.COMERCIO;
}

// ¿Maneja agenda de citas? (servicios, barbería, odontología, lavado, gimnasio…)
export function usesAppointments(input: Parameters<typeof resolveEffectiveModules>[0]) {
  return resolveEffectiveModules(input).includes('appointments');
}
