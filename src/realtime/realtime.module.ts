import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { RealtimeService } from './realtime.service';
import { RealtimeController } from './realtime.controller';
import { RealtimeInterceptor } from './realtime.interceptor';

// Módulo GLOBAL: expone RealtimeService a toda la app (sin importarlo en cada
// módulo) y registra el interceptor global que emite eventos tras cada escritura.
@Global()
@Module({
  imports: [JwtModule.register({})],
  controllers: [RealtimeController],
  providers: [
    RealtimeService,
    { provide: APP_INTERCEPTOR, useClass: RealtimeInterceptor },
  ],
  exports: [RealtimeService],
})
export class RealtimeModule {}
