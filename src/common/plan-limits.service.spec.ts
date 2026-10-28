import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '@/prisma.service';
import { PlanLimitsService } from './plan-limits.service';
import { PlansConfigService } from './plans-config.service';

// Plantilla: servicio NestJS probado con Prisma y dependencias SIMULADAS (sin
// base de datos). Copiar este patrón para cualquier *.service.ts.
describe('PlanLimitsService.assertModule', () => {
  const prisma = { company: { findUnique: jest.fn() } };
  const plans = {
    planAllowsModule: jest.fn(),
    moduleMinPlan: jest.fn(() => 'IMPULSO'),
    planName: jest.fn((p: string) => p),
  };
  let svc: PlanLimitsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await Test.createTestingModule({
      providers: [
        PlanLimitsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PlansConfigService, useValue: plans },
      ],
    }).compile();
    svc = mod.get(PlanLimitsService);
  });

  it('sin companyId no restringe ni consulta', async () => {
    await expect(svc.assertModule(null, 'sales')).resolves.toBeUndefined();
    expect(prisma.company.findUnique).not.toHaveBeenCalled();
  });

  it('dashboard/settings son CORE: pasan sin consultar el plan', async () => {
    prisma.company.findUnique.mockResolvedValue({ plan: 'DESPEGUE', enabledModules: [] });
    await expect(svc.assertModule(1, 'settings')).resolves.toBeUndefined();
    await expect(svc.assertModule(1, 'dashboard')).resolves.toBeUndefined();
    expect(plans.planAllowsModule).not.toHaveBeenCalled();
  });

  it('control MANUAL por empresa manda sobre el plan', async () => {
    prisma.company.findUnique.mockResolvedValue({ plan: 'ORBITA', enabledModules: ['sales'] });
    await expect(svc.assertModule(1, 'sales')).resolves.toBeUndefined();
    await expect(svc.assertModule(1, 'cartera')).rejects.toMatchObject({
      response: { error: 'MODULE_DISABLED', module: 'cartera' },
    });
    expect(plans.planAllowsModule).not.toHaveBeenCalled();
  });

  it('sin control manual decide el plan: permite o bloquea con PLAN_FEATURE', async () => {
    prisma.company.findUnique.mockResolvedValue({ plan: 'DESPEGUE', enabledModules: [] });
    plans.planAllowsModule.mockReturnValueOnce(true);
    await expect(svc.assertModule(1, 'cartera')).resolves.toBeUndefined();
    plans.planAllowsModule.mockReturnValueOnce(false);
    const err = await svc.assertModule(1, 'cartera').catch((e) => e);
    expect(err).toBeInstanceOf(ForbiddenException);
    expect(err.getResponse()).toMatchObject({ error: 'PLAN_FEATURE', requiredPlan: 'IMPULSO' });
  });
});
