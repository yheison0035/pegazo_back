import {
  natureFromType,
  parseAccountRow,
  typeFromCode,
} from './ledger-accounts.import.util';

describe('ledger-accounts.import.util', () => {
  it('deduce grupo y naturaleza desde el código PUC', () => {
    expect(typeFromCode('1105')).toBe('ASSET');
    expect(typeFromCode('2205')).toBe('LIABILITY');
    expect(typeFromCode('3115')).toBe('EQUITY');
    expect(typeFromCode('4135')).toBe('INCOME');
    expect(typeFromCode('5105')).toBe('EXPENSE');
    expect(typeFromCode('6135')).toBe('COST');
    expect(typeFromCode('7105')).toBe('COST');
    expect(typeFromCode('9')).toBeNull();
    expect(natureFromType('ASSET')).toBe('DEBIT');
    expect(natureFromType('LIABILITY')).toBe('CREDIT');
    expect(natureFromType('COST')).toBe('DEBIT');
  });

  it('acepta encabezados en español y etiquetas con tilde', () => {
    expect(
      parseAccountRow({
        codigo: ' 4135 ',
        nombre: 'ventas',
        grupo: 'Ingresos',
        naturaleza: 'Crédito',
      }),
    ).toEqual({
      code: '4135',
      name: 'VENTAS',
      type: 'INCOME',
      nature: 'CREDIT',
    });
    expect(
      parseAccountRow({
        code: '1105',
        name: 'Caja',
        type: 'ASSET',
        nature: 'DEBIT',
      }),
    ).toEqual({
      code: '1105',
      name: 'CAJA',
      type: 'ASSET',
      nature: 'DEBIT',
    });
  });

  it('infiere grupo/naturaleza si no vienen', () => {
    expect(parseAccountRow({ codigo: '5120', nombre: 'Arriendo' })).toEqual({
      code: '5120',
      name: 'ARRIENDO',
      type: 'EXPENSE',
      nature: 'DEBIT',
    });
  });

  it('rechaza filas incompletas o con valores no reconocidos', () => {
    expect(() => parseAccountRow({ nombre: 'X' })).toThrow('Falta el código.');
    expect(() => parseAccountRow({ codigo: 'AB', nombre: 'X' })).toThrow(
      /numérico/,
    );
    expect(() => parseAccountRow({ codigo: '1105' })).toThrow(
      'Falta el nombre.',
    );
    expect(() =>
      parseAccountRow({ codigo: '1105', nombre: 'X', grupo: 'Raro' }),
    ).toThrow(/no reconocido/);
    expect(() =>
      parseAccountRow({ codigo: '1105', nombre: 'X', naturaleza: 'Z' }),
    ).toThrow(/Naturaleza/);
  });
});
