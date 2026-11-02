import { Test } from '@nestjs/testing';
import { CompaniesService } from './companies.service';
import { PrismaService } from '@/prisma.service';
import { MailService } from '@/mail/mail.service';

// Horario de atención por DÍA de la semana: se sanea y se guarda en
// bookingConfig.weekHours sin pisar el resto de la config de la página de citas,
// y se sincronizan openHour/closeHour como respaldo.
describe('CompaniesService · updateHours (por día)', () => {
  const user = { companyId: 90 };
  let prisma: any;
  let svc: CompaniesService;

  beforeEach(async () => {
    prisma = {
      company: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ bookingConfig: { skin: 'dark', foo: 1 } }),
        update: jest.fn(async ({ data }: any) => ({
          openHour: data.openHour ?? 9,
          closeHour: data.closeHour ?? 20,
          bookingConfig: data.bookingConfig ?? null,
        })),
      },
    };
    const mod = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: { sendMail: jest.fn() } },
      ],
    }).compile();
    svc = mod.get(CompaniesService);
  });

  it('guarda weekHours sin borrar el resto de bookingConfig y sincroniza open/close', async () => {
    await svc.updateHours(user, {
      weekHours: {
        '1': { open: 10, close: 14, closed: false }, // lunes
        '2': { open: 8, close: 20, closed: false }, // martes (más amplio)
        '0': { open: 9, close: 12, closed: true }, // domingo cerrado
      },
    });
    const data = prisma.company.update.mock.calls[0][0].data;
    // No pisa otras claves de la config de la página de citas.
    expect(data.bookingConfig.skin).toBe('dark');
    expect(data.bookingConfig.foo).toBe(1);
    // Guarda el horario saneado por día.
    expect(data.bookingConfig.weekHours['1']).toEqual({
      open: 10,
      close: 14,
      closed: false,
    });
    expect(data.bookingConfig.weekHours['0'].closed).toBe(true);
    // Respaldo: open = mínimo de días abiertos, close = máximo de días abiertos
    // (el domingo cerrado no cuenta).
    expect(data.openHour).toBe(8);
    expect(data.closeHour).toBe(20);
  });

  it('corrige un cierre que no es posterior a la apertura', async () => {
    await svc.updateHours(user, {
      weekHours: { '3': { open: 15, close: 15, closed: false } },
    });
    const data = prisma.company.update.mock.calls[0][0].data;
    expect(data.bookingConfig.weekHours['3'].close).toBeGreaterThan(
      data.bookingConfig.weekHours['3'].open,
    );
  });

  it('devuelve weekHours en la respuesta', async () => {
    const res = await svc.updateHours(user, {
      weekHours: { '5': { open: 9, close: 18, closed: false } },
    });
    expect(res.success).toBe(true);
    expect(res.data.weekHours['5']).toEqual({
      open: 9,
      close: 18,
      closed: false,
    });
  });
});
