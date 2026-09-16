import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RealtimeService } from './realtime.service';

const MUTATING = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

// Interceptor GLOBAL: tras CUALQUIER escritura exitosa (POST/PATCH/PUT/DELETE)
// emite un evento en vivo para la empresa del usuario (o del sitio, en la tienda
// online). Así todo el CRM se actualiza solo, sin sondeo, con un único punto de
// integración. Nunca rompe la respuesta: cualquier error del bus se ignora.
@Injectable()
export class RealtimeInterceptor implements NestInterceptor {
  constructor(private readonly realtime: RealtimeService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') return next.handle();
    const req = context.switchToHttp().getRequest();
    const method = req?.method;
    if (!req || !MUTATING.has(method)) return next.handle();

    return next.handle().pipe(
      tap(() => {
        try {
          const companyId = req.user?.companyId ?? req.website?.companyId ?? null;
          if (!companyId) return;
          const resource = this.resourceFromUrl(req.originalUrl || req.url || '');
          if (resource) this.realtime.emit(companyId, resource, method);
        } catch {
          /* el tiempo real nunca debe afectar la respuesta */
        }
      }),
    );
  }

  // '/sales/123?x=1' -> 'sales'
  private resourceFromUrl(url: string): string | null {
    const path = (url || '').split('?')[0].replace(/^\/+/, '');
    const seg = path.split('/')[0];
    return seg || null;
  }
}
