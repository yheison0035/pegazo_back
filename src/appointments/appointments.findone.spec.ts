import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '@/prisma.service';
import { AuditService } from '@/audit/audit.service';
import { PlanLimitsService } from '@/common/plan-limits.service';
import { PushService } from '@/push/push.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { MailService } from '@/mail/mail.service';
import { RealtimeService } from '@/realtime/realtime.service';

// findOne no debe permitir que un rol global lea una cita de OTRA empresa por id
// (bug cross-empresa), ni que un rol de sede lea la de otro local.
describe('AppointmentsService.findOne · aislamiento', () => {
  const make = async (prisma: any): Promise<AppointmentsService> => {
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

  it('un dueño NO puede leer una cita de otra empresa por id', async () => {
    const prisma: any = {
      appointment: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 10, localId: 5, companyId: 2 }),
      },
      // El local 5 no es de la empresa 1 → findFirst no lo encuentra.
      local: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const svc = await make(prisma);
    await expect(
      svc.findOne(10, { companyId: 1, id: 1, role: 'SUPER_ADMIN' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('un rol de sede NO puede leer la cita de otro local', async () => {
    const prisma: any = {
      appointment: {
        findUnique: jest.fn().mockResolvedValue({ id: 11, localId: 1 }),
      },
      // El usuario es del local 2 (getAccessibleLocalIds → [2]).
      local: { findFirst: jest.fn().mockResolvedValue({ id: 2, companyId: 1 }) },
    };
    const svc = await make(prisma);
    await expect(
      svc.findOne(11, { companyId: 1, id: 7, role: 'BARBERO', localId: 2 }),
    ).rejects.toThrow(ForbiddenException);
  });
});
