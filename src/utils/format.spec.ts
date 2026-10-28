import { formatYMD, minutesToColombiaHour, timeToMinutes } from './format';

// La hora de las citas se guarda en 12h ("01:00 p. m."); estas utilidades son
// la base de la disponibilidad y el orden de la agenda.
describe('timeToMinutes (12h → minutos)', () => {
  it.each([
    ['12:00 a. m.', 0],
    ['01:00 a. m.', 60],
    ['09:30 a. m.', 570],
    ['12:00 p. m.', 720],
    ['01:00 p. m.', 780],
    ['11:59 p. m.', 1439],
  ])('%s → %i', (txt, min) => expect(timeToMinutes(txt)).toBe(min));

  it('tolera espacio duro (NBSP), mayúsculas y espacios extra', () => {
    expect(timeToMinutes('01:00 P. M.')).toBe(780);
    expect(timeToMinutes('  09:15   a.m. ')).toBe(555);
  });
});

describe('minutesToColombiaHour (minutos → 12h)', () => {
  it.each([
    [0, '12:00 a. m.'],
    [60, '01:00 a. m.'],
    [720, '12:00 p. m.'],
    [780, '01:00 p. m.'],
    [1439, '11:59 p. m.'],
  ])('%i → %s', (min, txt) => expect(minutesToColombiaHour(min)).toBe(txt));

  it('ida y vuelta conserva el valor en toda la jornada (cada 30 min)', () => {
    for (let m = 0; m < 1440; m += 30) expect(timeToMinutes(minutesToColombiaHour(m))).toBe(m);
  });
});

describe('formatYMD', () => {
  it('rellena con ceros mes y día', () => {
    expect(formatYMD(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
