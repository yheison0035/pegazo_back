import { Test } from '@nestjs/testing';
import { BankService } from './bank.service';
import { PrismaService } from '@/prisma.service';
import { PushService } from '@/push/push.service';
import { NotificationsService } from '@/notifications/notifications.service';

// Consignaciones por local: el token del SMS enruta la consignación a su sede;
// cada local solo ve/oye las suyas; el admin configura el token de su local.
describe('BankService · consignaciones por local', () => {
  const make = async (prisma: any): Promise<BankService> => {
    const mod = await Test.createTestingModule({
      providers: [
        BankService,
        { provide: PrismaService, useValue: prisma },
        { provide: PushService, useValue: { sendToCompanyRoles: jest.fn().mockResolvedValue(null) } },
        {
          provide: NotificationsService,
          useValue: { createForRoles: jest.fn().mockResolvedValue(null) },
        },
      ],
    }).compile();
    return mod.get(BankService);
  };

  it('el SMS con token de un local crea la consignación en ESA sede', async () => {
    const prisma: any = {
      localBankNotify: {
        findFirst: jest.fn().mockResolvedValue({
          localId: 2,
          company: { id: 1, name: 'Negocio', bankIdentifier: null },
        }),
      },
      bankProcessedEmail: { create: jest.fn().mockResolvedValue({}) },
      bankDeposit: { create: jest.fn().mockResolvedValue({ id: 9, amount: 50000 }) },
    };
    const svc = await make(prisma);
    await svc.receiveSms('tok-local-2', {
      text: 'Bancolombia: recibiste un pago de JUAN por $50.000',
      amount: 50000,
    });
    const data = prisma.bankDeposit.create.mock.calls[0][0].data;
    expect(data.localId).toBe(2);
    expect(data.companyId).toBe(1);
  });

  it('un rol de sede solo lista las consignaciones de su local', async () => {
    const prisma: any = {
      local: { findFirst: jest.fn().mockResolvedValue({ id: 2, companyId: 1 }) },
      bankDeposit: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const svc = await make(prisma);
    await svc.list({ companyId: 1, id: 7, role: 'ADMIN', localId: 2 }, {});
    const where = prisma.bankDeposit.findMany.mock.calls[0][0].where;
    expect(where.localId).toEqual({ in: [2] });
  });

  it('el dueño ve las consignaciones de toda la empresa', async () => {
    const prisma: any = {
      bankDeposit: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const svc = await make(prisma);
    await svc.list({ companyId: 1, id: 1, role: 'SUPER_ADMIN' }, {});
    const where = prisma.bankDeposit.findMany.mock.calls[0][0].where;
    expect(where.localId).toBeUndefined();
  });

  it('el admin activa/ajusta el token de SU local', async () => {
    const prisma: any = {
      local: { findFirst: jest.fn().mockResolvedValue({ id: 2, companyId: 1 }) },
      localBankNotify: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({}),
      },
    };
    const svc = await make(prisma);
    const res = await svc.enable({ companyId: 1, id: 7, role: 'ADMIN', localId: 2 }, {});
    expect(prisma.localBankNotify.upsert).toHaveBeenCalled();
    const arg = prisma.localBankNotify.upsert.mock.calls[0][0];
    expect(arg.where).toEqual({ localId: 2 });
    expect((res.data as any).scope).toBe('local');
  });
});
