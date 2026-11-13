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
//   1) REGISTRATION_PENDING — empresa AUTO-REGISTRADA (selfRegistered) sin una
//      ventana de días gratis vigente: solo ve el muro de adaptación hasta que la
//      plataforma la active o le obsequie días gratis (paidUntil futuro). Las
//      creadas por la plataforma NO llevan esta marca → no se bloquean por esto.
//   2) SUBSCRIPTION_OVERDUE — empresa GESTIONADA cuyo pago venció (paidUntil +
//      gracia).
// La plataforma (SUPER_PLATFORM_ADMIN) no se ve afectada. El modo SOPORTE
// (impersonación) SÍ: debe comportarse igual que el dueño.
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

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

    // El modo soporte (impersonación) NO se exime: debe comportarse igual que el
    // dueño. Para configurar una empresa bloqueada, primero se le dan días gratis
    // desde la plataforma (sesión real SUPER_PLATFORM_ADMIN, exenta) y luego se
    // entra en soporte, ya con la ventana vigente.
    const isCompanyUser =
      user && user.role !== 'SUPER_PLATFORM_ADMIN' && !!user.companyId;

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
        // 1) Bloqueo por ORIGEN: empresa auto-registrada sin días gratis vigentes.
        // Solo ve el muro de adaptación hasta que la plataforma la active (le
        // quita la marca selfRegistered) o le dé días gratis (paidUntil futuro).
        if (user.selfRegistered && !hasActiveWindow) {
          throw new HttpException(
            {
              success: false,
              error: 'REGISTRATION_PENDING',
              message:
                'Estamos adaptando Pegazo a tu negocio. Escríbenos para activarte o pedir unos días gratis de prueba.',
            },
            402,
          );
        }

        // 2) Bloqueo por impago (empresas GESTIONADAS con paidUntil vencido+gracia).
        if (
          !user.selfRegistered &&
          user.paidUntil &&
          todayYmd > blockDeadlineYmd(new Date(user.paidUntil))
        ) {
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
