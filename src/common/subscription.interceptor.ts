import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

// Bloqueo EN TIEMPO REAL de las operaciones de ESCRITURA (POST/PUT/PATCH/DELETE)
// con un 402. Las lecturas (GET) siguen permitidas para que el CRM cargue y pueda
// mostrar el muro correspondiente. Dos motivos:
//   1) PLAN_LOCKED — plan distinto de ORBITA (único disponible por ahora) sin una
//      ventana de días gratis vigente. La plataforma adapta el CRM al negocio y,
//      si el cliente quiere probar, se le obsequian días gratis (paidUntil futuro).
//   2) SUBSCRIPTION_OVERDUE — empresa ORBITA cuyo pago venció (paidUntil + gracia).
// La plataforma (SUPER_PLATFORM_ADMIN) y las sesiones de SOPORTE (impersonación)
// no se ven afectadas.
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Único plan disponible hoy. Debe coincidir con el front (lib/plans.js: el único
// sin `comingSoon`). Los demás quedan bloqueados hasta tener ~100 clientes.
const ACTIVE_PLAN = 'ORBITA';

// Día(s) de gracia (calendario) DESPUÉS del vencimiento antes de bloquear. Da
// margen para pagar: el día de vencimiento y la gracia siguen trabajando (solo
// ven el aviso de renovación); se bloquea al día siguiente de la gracia. La
// misma regla la aplica el muro de pago del front (PaymentWall) para que
// coincidan exactamente.
const GRACE_DAYS = 1;

// Último día (YYYY-MM-DD) SIN bloqueo = vencimiento + gracia. paidUntil se
// guarda a medianoche UTC del día de vencimiento, así que se compara por fecha.
function blockDeadlineYmd(paidUntil: Date): string {
  const base = new Date(paidUntil);
  base.setUTCDate(base.getUTCDate() + GRACE_DAYS);
  return base.toISOString().slice(0, 10);
}

// Rutas que SIEMPRE deben funcionar aunque la empresa esté vencida (para no
// dejar al usuario sin salida: login/refresh, cambio de contraseña, cerrar
// notificaciones, etc.). Se comparan por "incluye".
const ALLOW_PATHS = ['/auth/', '/notifications/'];

@Injectable()
export class SubscriptionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const user = req?.user;
    const method = (req?.method || 'GET').toUpperCase();

    const isCompanyUser =
      user &&
      user.role !== 'SUPER_PLATFORM_ADMIN' &&
      !!user.companyId &&
      // Las sesiones de soporte (impersonación) no se bloquean: la plataforma
      // necesita poder inspeccionar/configurar la empresa aunque esté bloqueada.
      !user.impersonatedBy;

    if (isCompanyUser && WRITE_METHODS.has(method)) {
      const path = (req.originalUrl || req.url || '').split('?')[0];
      const allowed = ALLOW_PATHS.some((p) => path.includes(p));

      // paidUntil se guarda a medianoche UTC del día de vencimiento → se
      // interpreta como ESE día de calendario (igual que en pantalla). La
      // empresa trabaja normal el día de vencimiento y el/los día(s) de gracia.
      const todayYmd = new Date().toLocaleDateString('en-CA', {
        timeZone: 'America/Bogota',
      });
      // Ventana vigente = tiene paidUntil y hoy no pasó del vencimiento+gracia.
      // Es lo que fija el botón "Días gratis" de la plataforma (paidUntil futuro).
      const hasActiveWindow =
        !!user.paidUntil &&
        todayYmd <= blockDeadlineYmd(new Date(user.paidUntil));

      if (!allowed) {
        // 1) Bloqueo por PLAN: solo ORBITA está disponible. Cualquier otro plan
        // (o sin plan) queda bloqueado salvo días gratis vigentes.
        if (user.plan !== ACTIVE_PLAN && !hasActiveWindow) {
          throw new HttpException(
            {
              success: false,
              error: 'PLAN_LOCKED',
              message:
                'Estamos adaptando Pegazo a tu negocio. Escríbenos para activarte o pedir unos días gratis de prueba.',
            },
            402,
          );
        }

        // 2) Bloqueo por impago (empresas ORBITA con paidUntil vencido+gracia).
        if (user.paidUntil && todayYmd > blockDeadlineYmd(new Date(user.paidUntil))) {
          throw new HttpException(
            {
              success: false,
              error: 'SUBSCRIPTION_OVERDUE',
              message:
                'Tu suscripción de Pegazo venció. Realiza el pago para reactivar tu cuenta.',
            },
            402,
          );
        }
      }
    }

    return next.handle();
  }
}
