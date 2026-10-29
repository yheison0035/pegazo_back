import { Test } from '@nestjs/testing';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '@/prisma.service';
import { AuditService } from '@/audit/audit.service';
import { PlanLimitsService } from '@/common/plan-limits.service';
import { PushService } from '@/push/push.service';
import { NotificationsService } from '@/notifications/notifications.service';

// "Nueva cita asignada": debe llegar al barbero asignado por la CAMPANA (in-app)
// y por push; a nadie más. Regla: el barbero solo ve lo suyo.
describe('AppointmentsService.notifyBarberNewAppointment', () => {
  const prisma = {
    service: { findUnique: jest.fn().mockResolvedValue({ name: 'Corte' }) },
    customer: { findUnique: jest.fn().mockResolvedValue({ name: 'Ana' }) },
  };
  const push = { sendToUser: jest.fn().mockResolvedValue(undefined) };
  const notifications = { create: jest.fn().mockResolvedValue({ id: 1 }) };
  let svc: AppointmentsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: PlanLimitsService, useValue: { assertModule: jest.fn() } },
        { provide: PushService, useValue: push },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();
    svc = mod.get(AppointmentsService);
  });

  const appt = {
    id: 77,
    barberId: 9,
    serviceId: 3,
    customerId: 5,
    date: '2026-10-29T00:00:00.000Z',
    startTime: '03:00 p. m.',
  };

  it('crea la notificación in-app SOLO para el barbero asignado, con el mismo texto que el push', async () => {
    await (svc as any).notifyBarberNewAppointment(appt, 90);
    expect(notifications.create).toHaveBeenCalledTimes(1);
    const [companyId, userId, input] = notifications.create.mock.calls[0];
    expect(companyId).toBe(90);
    expect(userId).toBe(9);
    expect(input).toMatchObject({
      type: 'APPOINTMENT_ASSIGNED',
      url: '/dashboard/appointments',
      data: { appointmentId: 77 },
    });
    expect(input.body).toContain('Ana');
    expect(input.body).toContain('Corte');
    expect(push.sendToUser).toHaveBeenCalledWith(
      9,
      expect.objectContaining({ title: input.title, body: input.body }),
    );
  });

  it('si la campana falla, el push igual sale (no rompe la creación de la cita)', async () => {
    notifications.create.mockRejectedValueOnce(new Error('db'));
    await expect((svc as any).notifyBarberNewAppointment(appt, 90)).resolves.toBeUndefined();
    expect(push.sendToUser).toHaveBeenCalledTimes(1);
  });
});
