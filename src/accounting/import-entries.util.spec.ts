import {
  groupJournalRows,
  isJournalRow,
  parseAmount,
} from './import-entries.util';

describe('import-entries.util', () => {
  describe('parseAmount', () => {
    it('acepta números y textos con formato colombiano/inglés', () => {
      expect(parseAmount(250000)).toBe(250000);
      expect(parseAmount('250000')).toBe(250000);
      expect(parseAmount('$ 250.000')).toBe(250000);
      expect(parseAmount('1.234.567')).toBe(1234567);
      expect(parseAmount('1,234,567.50')).toBe(1234568);
      expect(parseAmount('1.234.567,49')).toBe(1234567);
      expect(parseAmount('12,5')).toBe(13);
      expect(parseAmount('')).toBe(0);
      expect(parseAmount(null)).toBe(0);
      expect(parseAmount('abc')).toBe(0);
    });
  });

  describe('isJournalRow', () => {
    it('distingue filas PAR de filas DIARIO', () => {
      expect(
        isJournalRow({ cuentaDebito: '1105', cuentaCredito: '4135', valor: 1 }),
      ).toBe(false);
      expect(isJournalRow({ cuenta: '1105', debito: 100 })).toBe(true);
      expect(isJournalRow({ cuenta: '', debito: 100 })).toBe(false);
      expect(isJournalRow(null)).toBe(false);
    });
  });

  describe('groupJournalRows', () => {
    it('agrupa por número de asiento y conserva el orden', () => {
      const { groups, errors } = groupJournalRows([
        {
          rowNo: 2,
          fecha: '2026-01-05',
          descripcion: 'Venta',
          asiento: '1',
          cuenta: '1105',
          debito: '119.000',
          credito: '',
        },
        {
          rowNo: 3,
          fecha: '2026-01-05',
          descripcion: 'Venta',
          asiento: '1',
          cuenta: '4135',
          debito: '',
          credito: 100000,
        },
        {
          rowNo: 4,
          fecha: '2026-01-05',
          descripcion: 'Venta',
          asiento: '1',
          cuenta: '2408',
          debito: '',
          credito: 19000,
        },
        {
          rowNo: 5,
          fecha: '2026-01-06',
          descripcion: 'Arriendo',
          asiento: '2',
          cuenta: '5120',
          debito: 500000,
          credito: '',
        },
        {
          rowNo: 6,
          fecha: '2026-01-06',
          descripcion: 'Arriendo',
          asiento: '2',
          cuenta: '1110',
          debito: '',
          credito: 500000,
        },
      ]);
      expect(errors).toEqual([]);
      expect(groups).toHaveLength(2);
      expect(groups[0].rowNos).toEqual([2, 3, 4]);
      expect(groups[0].description).toBe('Venta');
      expect(groups[0].reference).toBe('1');
      expect(groups[0].lines).toEqual([
        { accountCode: '1105', debit: 119000, credit: 0 },
        { accountCode: '4135', debit: 0, credit: 100000 },
        { accountCode: '2408', debit: 0, credit: 19000 },
      ]);
      expect(groups[1].lines).toHaveLength(2);
    });

    it('sin columna asiento agrupa por fecha + descripción + referencia', () => {
      const { groups } = groupJournalRows([
        {
          rowNo: 2,
          fecha: '2026-02-01',
          descripcion: 'Aporte',
          referencia: 'R1',
          cuenta: '1105',
          debito: 5000000,
        },
        {
          rowNo: 3,
          fecha: '2026-02-01',
          descripcion: 'Aporte',
          referencia: 'R1',
          cuenta: '3115',
          credito: 5000000,
        },
        {
          rowNo: 4,
          fecha: '2026-02-01',
          descripcion: 'Otro',
          referencia: '',
          cuenta: '1105',
          debito: 10,
        },
        {
          rowNo: 5,
          fecha: '2026-02-01',
          descripcion: 'Otro',
          referencia: '',
          cuenta: '4135',
          credito: 10,
        },
      ]);
      expect(groups.map((g) => g.rowNos)).toEqual([
        [2, 3],
        [4, 5],
      ]);
      expect(groups[0].reference).toBe('R1');
      expect(groups[1].reference).toBeNull();
    });

    it('reporta filas sin cuenta, sin valor o con débito y crédito a la vez', () => {
      const { groups, errors } = groupJournalRows([
        { rowNo: 2, fecha: '2026-02-01', cuenta: '', debito: 1 },
        {
          rowNo: 3,
          fecha: '2026-02-01',
          cuenta: '1105',
          debito: '',
          credito: '',
        },
        {
          rowNo: 4,
          fecha: '2026-02-01',
          cuenta: '1105',
          debito: 5,
          credito: 5,
        },
        {
          rowNo: 5,
          fecha: '2026-02-01',
          asiento: '9',
          cuenta: '1105',
          debito: 5,
        },
      ]);
      expect(errors.map((e) => e.row)).toEqual([2, 3, 4]);
      expect(groups).toHaveLength(1);
      expect(groups[0].description).toBe('Asiento 9');
    });
  });
});
