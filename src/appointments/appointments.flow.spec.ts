import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '@/prisma.service';
import { AuditService } from '@/audit/audit.service';
import { PlanLimitsService } from '@/common/plan-limits.service';
import { PushService } from '@/push/push.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { MailService } from '@/mail/mail.service';
import { RealtimeService } from '@/realtime/realtime.service';

// Cambio de estado rápido de una cita (select del calendario) y confirmación.
describe('AppointmentsService · estados', () => {
  const user = { companyId: 90, id: 1, role: 'ADMIN' };
  const prisma: any = {
    appointment: {
      findFirst: jest.fn().mockResolvedValue({ id: 7, status: 'PENDIENTE' }),
      update: jest.fn().mockResolvedValue({ id: 7 }),
      // sendAppointmentMail (privado) llama a findUnique; sin correo no envía.
      findUnique: jest.fn().mockResolvedValue({
        companyId: 90,
        startTime: '10:00 a. m.',
        date: new Date('2026-11-10T00:00:00Z'),
        service: { name: 'Corte' },
        barber: { name: 'Luis' },
        local: { name: 'Centro' },
        customer: { name: 'Ana', email: null },
      }),
    },
  };
  const mail = { sendAppointmentEmail: jest.fn() };
  let svc: AppointmentsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: PlanLimitsService, useValue: { assertModule: jest.fn() } },
        { provide: PushService, useValue: { sendToUser: jest.fn() } },
        { provide: NotificationsService, useValue: { create: jest.fn() } },
        { provide: MailService, useValue: mail },
        { provide: RealtimeService, useValue: { emit: jest.fn() } },
      ],
    }).compile();
    svc = mod.get(AppointmentsService);
  });

  it('rechaza un estado inválido', async () => {
    await expect(svc.setAppointmentStatus(7, 'BASURA', user)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('cancelar solo cambia el estado (sin confirmar con el cliente)', async () => {
    await svc.setAppointmentStatus(7, 'CANCELADA', user);
    expect(prisma.appointment.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { status: 'CANCELADA' },
    });
  });

  it('confirmar marca CONFIRMADA + clientConfirmed', async () => {
    await svc.setAppointmentStatus(7, 'CONFIRMADA', user);
    expect(prisma.appointment.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { status: 'CONFIRMADA', clientConfirmed: true },
    });
  });

  it('completar manualmente cambia a COMPLETADA', async () => {
    await svc.setAppointmentStatus(7, 'completada', user); // acepta minúsculas
    expect(prisma.appointment.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { status: 'COMPLETADA' },
    });
  });

  it('si la cita no existe, falla', async () => {
    prisma.appointment.findFirst.mockResolvedValueOnce(null);
    await expect(svc.setAppointmentStatus(7, 'CANCELADA', user)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('confirmAppointment deja la cita CONFIRMADA', async () => {
    const r = await svc.confirmAppointment(7, user);
    expect(prisma.appointment.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { status: 'CONFIRMADA', clientConfirmed: true },
    });
    expect(r).toMatchObject({ success: true, data: { status: 'CONFIRMADA' } });
  });
});
