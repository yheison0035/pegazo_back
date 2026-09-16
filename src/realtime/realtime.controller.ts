import {
  Controller,
  Query,
  Sse,
  UnauthorizedException,
  MessageEvent,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable, interval, merge } from 'rxjs';
import { map } from 'rxjs/operators';
import { RealtimeService } from './realtime.service';

@Controller('realtime')
export class RealtimeController {
  constructor(
    private readonly realtime: RealtimeService,
    private readonly jwt: JwtService,
  ) {}

  // Flujo SSE en vivo. EventSource NO puede mandar cabeceras, así que el token va
  // por query (?token=). Se valida aquí y solo se entregan los eventos de la
  // empresa del usuario. Un "ping" cada 25s mantiene viva la conexión.
  @Sse('stream')
  stream(@Query('token') token: string): Observable<MessageEvent> {
    let companyId: number | null = null;
    try {
      const payload: any = this.jwt.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      companyId = payload?.companyId ?? null;
    } catch {
      throw new UnauthorizedException('Token inválido');
    }

    const heartbeat = interval(25000).pipe(
      map(() => ({ data: { type: 'ping', at: Date.now() } }) as MessageEvent),
    );

    // SUPER_PLATFORM_ADMIN sin empresa: solo heartbeat (no hay tenant que observar).
    if (!companyId) return heartbeat;

    const events = this.realtime.forCompany(companyId).pipe(
      map((e) => ({ data: e }) as MessageEvent),
    );

    return merge(events, heartbeat);
  }
}
