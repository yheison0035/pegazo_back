import { resolveBranding } from './branding.util';

describe('resolveBranding', () => {
  const company = {
    name: 'Empresa S.A.S',
    logo: 'empresa.png',
    nit: '900',
    email: 'empresa@correo.com',
    phone: '111',
  };
  const local = {
    name: 'Sede Centro',
    logo: 'sede.png',
    nit: '901',
    email: 'sede@correo.com',
    phone: '222',
    address: 'Calle 1',
  };

  it('con UNA sola sede usa SIEMPRE los datos de la empresa', () => {
    const b = resolveBranding(company, local, false);
    expect(b.name).toBe('Empresa S.A.S');
    expect(b.logo).toBe('empresa.png');
    expect(b.nit).toBe('900');
    expect(b.email).toBe('empresa@correo.com');
    expect(b.phone).toBe('111');
    // La dirección de la empresa no se expone aquí (va en encabezados propios).
    expect(b.address).toBeNull();
  });

  it('con VARIAS sedes usa los datos del local', () => {
    const b = resolveBranding(company, local, true);
    expect(b.name).toBe('Sede Centro');
    expect(b.logo).toBe('sede.png');
    expect(b.nit).toBe('901');
    expect(b.email).toBe('sede@correo.com');
    expect(b.phone).toBe('222');
    expect(b.address).toBe('Calle 1');
  });

  it('con varias sedes cae a la empresa cuando el local no tiene ese dato', () => {
    const b = resolveBranding(company, { name: 'Sede Norte' }, true);
    expect(b.name).toBe('Sede Norte');
    expect(b.logo).toBe('empresa.png');
    expect(b.nit).toBe('900');
    expect(b.email).toBe('empresa@correo.com');
    expect(b.phone).toBe('111');
  });

  it('multi sin local resuelto cae a la empresa', () => {
    const b = resolveBranding(company, null, true);
    expect(b.name).toBe('Empresa S.A.S');
    expect(b.logo).toBe('empresa.png');
  });
});
