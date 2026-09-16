import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface RealtimeEvent {
  companyId: number;
  resource: string;
  action: string;
  at: number;
}

// Bus de eventos en tiempo real por EMPRESA. Los servicios/interceptor publican
// un evento cuando algo cambia y el endpoint SSE lo empuja SOLO a los clientes de
// esa empresa. Reemplaza el sondeo del front: el navegador ya no consulta cada X
// segundos, sino que el backend le avisa cuando de verdad hay un cambio.
@Injectable()
export class RealtimeService {
  private readonly stream$ = new Subject<RealtimeEvent>();

  emit(
    companyId: number | null | undefined,
    resource: string,
    action = 'change',
  ) {
    if (!companyId || !resource) return;
    this.stream$.next({ companyId, resource, action, at: Date.now() });
  }

  // Flujo de eventos filtrado a una empresa (para el endpoint SSE).
  forCompany(companyId: number): Observable<RealtimeEvent> {
    return this.stream$.pipe(map((e) => e)).pipe(
      // filtramos por empresa para no filtrar datos entre tenants
      filter((e) => e.companyId === companyId),
    );
  }
}
