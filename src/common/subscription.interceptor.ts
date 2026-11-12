import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

// Bloqueo por impago EN TIEMPO REAL (estilo Alegra/Siigo/Treinta).
// Si la empresa del usuario ya venció (paidUntil + gracia < hoy), se rechazan
// las operaciones de ESCRITURA (POST/PUT/PATCH/DELETE) con un 402. Las lecturas
// (GET) siguen permitidas para que el CRM cargue y pueda mostrar el "muro de
// pago" con las instrucciones. La plataforma (SUPER_PLATFORM_ADMIN) y las
// empresas sin paidUntil (control manual) no se ven afectadas.
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

    const isCompanyUser =
      user && user.role !== 'SUPER_PLATFORM_ADMIN' && !!user.companyId;

    if (isCompanyUser && WRITE_METHODS.has(method) && user.paidUntil) {
      // paidUntil se guarda a medianoche UTC del día de vencimiento → se
      // interpreta como ESE día de calendario (igual que en pantalla). La
      // empresa trabaja normal el día de vencimiento y el/los día(s) de gracia;
      // solo se bloquea al día siguiente de la gracia (comparación por fecha en
      // zona Colombia).
      const deadlineYmd = blockDeadlineYmd(new Date(user.paidUntil));
      const todayYmd = new Date().toLocaleDateString('en-CA', {
        timeZone: 'America/Bogota',
      });
      const overdue = todayYmd > deadlineYmd;
      const path = (req.originalUrl || req.url || '').split('?')[0];
      const allowed = ALLOW_PATHS.some((p) => path.includes(p));

      if (overdue && !allowed) {
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

    return next.handle();
  }
}
