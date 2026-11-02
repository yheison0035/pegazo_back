import { Test } from '@nestjs/testing';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '@/prisma.service';
import { AuditService } from '@/audit/audit.service';
import { PlanLimitsService } from '@/common/plan-limits.service';
import { PushService } from '@/push/push.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { MailService } from '@/mail/mail.service';
import { RealtimeService } from '@/realtime/realtime.service';

// Horario de atención por DÍA de la semana (el negocio puede manejar horarios
// distintos de lunes a domingo, o cerrar un día). Se guarda en
// bookingConfig.weekHours (clave 0=Dom..6=Sáb) y getAvailability debe respetarlo.
describe('AppointmentsService · disponibilidad por día', () => {
  // 2027-01-04 es lunes (weekday 1), fecha futura para no chocar con el filtro
  // de "horas ya pasadas" que solo aplica al día de hoy.
  const MONDAY = '2027-01-04';

  const buildPrisma = (bookingConfig: any) => ({
    user: { findUnique: jest.fn().mockResolvedValue({ restWeekdays: [] }) },
    employeeTimeOff: { findFirst: jest.fn().mockResolvedValue(null) },
    service: {
      findUnique: jest.fn().mockResolvedValue({
        id: 5,
        companyId: 90,
        duration: 30,
      }),
    },
    company: {
      findUnique: jest.fn().mockResolvedValue({
        openHour: 9,
        closeHour: 20,
        bookingConfig,
      }),
    },
    appointment: { findMany: jest.fn().mockResolvedValue([]) },
  });

  const makeSvc = async (prisma: any): Promise<AppointmentsService> => {
    const mod = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: PlanLimitsService, useValue: { assertModule: jest.fn() } },
        { provide: PushService, useValue: { sendToUser: jest.fn() } },
        { provide: NotificationsService, useValue: { create: jest.fn() } },
        { provide: MailService, useValue: { sendAppointmentEmail: jest.fn() } },
        { provide: RealtimeService, useValue: { emit: jest.fn() } },
      ],
    }).compile();
    return mod.get(AppointmentsService);
  };

  it('un día marcado como cerrado no ofrece horarios', async () => {
    const svc = await makeSvc(
      buildPrisma({ weekHours: { '1': { open: 10, close: 12, closed: true } } }),
    );
    const res = await svc.getAvailability({
      barberId: 1,
      serviceId: 5,
      date: MONDAY,
    });
    expect(res.off).toBe(true);
    expect(res.reason).toBe('Cerrado ese día');
    expect(res.slots).toEqual([]);
  });

  it('respeta el horario propio del día (10:00–12:00)', async () => {
    const svc = await makeSvc(
      buildPrisma({ weekHours: { '1': { open: 10, close: 12, closed: false } } }),
    );
    const res = await svc.getAvailability({
      barberId: 1,
      serviceId: 5,
      date: MONDAY,
    });
    expect(res.off).toBe(false);
    // Rango 10–12, intervalos visibles cada 30 min con servicio de 30 min:
    // 10:00, 10:30, 11:00, 11:30 (la de 12:00 no cabe). → 4 franjas.
    expect(res.slots).toHaveLength(4);
  });

  it('sin horario por día usa el rango general open/close', async () => {
    const svc = await makeSvc(buildPrisma({}));
    const res = await svc.getAvailability({
      barberId: 1,
      serviceId: 5,
      date: MONDAY,
    });
    expect(res.off).toBe(false);
    // Rango general 9–20: hay muchas franjas disponibles.
    expect(res.slots.length).toBeGreaterThan(4);
  });

  // resolveBusinessHours es la fuente ÚNICA que comparten la disponibilidad y la
  // reserva pública: si se desconectara, las citas dejarían de respetar el
  // horario. Se prueba directamente para blindar esa conexión.
  describe('resolveBusinessHours (fuente compartida)', () => {
    let svc: AppointmentsService;
    beforeEach(async () => {
      svc = await makeSvc(buildPrisma({}));
    });

    it('usa el horario del día cuando está configurado', () => {
      const r = svc.resolveBusinessHours(
        { openHour: 9, closeHour: 20, bookingConfig: { weekHours: { '1': { open: 10, close: 14, closed: false } } } },
        MONDAY,
      );
      expect(r).toEqual({ closed: false, startHour: 10, endHour: 14 });
    });

    it('marca cerrado el día cerrado', () => {
      const r = svc.resolveBusinessHours(
        { bookingConfig: { weekHours: { '1': { open: 10, close: 14, closed: true } } } },
        MONDAY,
      );
      expect(r.closed).toBe(true);
    });

    it('cae al rango general cuando el día no está configurado', () => {
      const r = svc.resolveBusinessHours(
        { openHour: 8, closeHour: 19, bookingConfig: {} },
        MONDAY,
      );
      expect(r).toEqual({ closed: false, startHour: 8, endHour: 19 });
    });
  });
});
