import {
  resolveEffectiveModules,
  usesAppointments,
} from './effective-modules.util';

describe('resolveEffectiveModules (misma prioridad que el menú)', () => {
  it('el control manual por empresa manda sobre todo', () => {
    expect(
      resolveEffectiveModules({
        enabledModules: ['sales'],
        typeModules: ['x'],
        type: 'BARBERIA',
      }),
    ).toEqual(['sales']);
  });
  it('sin manual, manda la configuración del tipo en BD', () => {
    expect(
      resolveEffectiveModules({
        enabledModules: [],
        typeModules: ['a', 'b'],
        type: 'BARBERIA',
      }),
    ).toEqual(['a', 'b']);
  });
  it('sin BD, usa el mapa del código; tipo desconocido → COMERCIO', () => {
    expect(resolveEffectiveModules({ type: 'BARBERIA' })).toContain(
      'appointments',
    );
    expect(resolveEffectiveModules({ type: 'NO_EXISTE' })).toContain('sales');
    expect(resolveEffectiveModules({ type: 'NO_EXISTE' })).not.toContain(
      'appointments',
    );
  });
});

describe('usesAppointments (regresión: estadísticas solo contaban SERVICIOS/ODONTOLOGIA)', () => {
  it.each([
    'SERVICIOS',
    'BARBERIA',
    'ODONTOLOGIA',
    'LAVADO_VEHICULOS',
    'CANCHAS_SINTETICAS',
    'GIMNASIO',
    'TALLER_MECANICO',
    'VETERINARIA',
  ])('%s maneja citas', (t) => {
    expect(usesAppointments({ type: t })).toBe(true);
  });
  it.each([
    'COMERCIO',
    'CARNICERIA',
    'RESTAURANTE',
    'PARQUEADERO',
    'PANADERIA',
  ])('%s NO maneja citas', (t) => {
    expect(usesAppointments({ type: t })).toBe(false);
  });
});
