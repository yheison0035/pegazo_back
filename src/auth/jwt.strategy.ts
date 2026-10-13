import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '@/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    // Configura Passport para extraer token de Authorization: Bearer <token>.
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error(
        'JWT_SECRET no está definido en las variables de entorno. Configúralo antes de arrancar.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  // En validate, construye el objeto req.user que viajará en todas las peticiones protegidas.
  async validate(payload: any) {
    // El ROL y el LOCAL se leen SIEMPRE desde la BD (no del token): así un
    // cambio de rol/local surte efecto al instante, sin esperar a que el usuario
    // vuelva a iniciar sesión, y ningún token viejo puede llevar un rol
    // desactualizado (seguridad + evita falsos "No tienes permisos").
    // Suspensión por impago: también se revalida el estado de la empresa en CADA
    // petición. El SUPER_PLATFORM_ADMIN es de plataforma y no depende de empresa.
    let paidUntil: Date | null = null;
    let role = payload.role;
    let localId = payload.localId;

    if (payload.role !== 'SUPER_PLATFORM_ADMIN') {
      const dbUser = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          role: true,
          localId: true,
          status: true,
          company: { select: { status: true, paidUntil: true } },
        },
      });

      // Usuario inexistente o desactivado/eliminado → se corta la sesión.
      if (!dbUser || dbUser.status !== 'ACTIVO') {
        throw new UnauthorizedException('Tu usuario no está activo.');
      }

      role = dbUser.role;
      localId = dbUser.localId;

      if (payload.companyId) {
        if (!dbUser.company || dbUser.company.status !== 'ACTIVO') {
          throw new UnauthorizedException('Tu empresa está suspendida.');
        }
        // Fecha de pago para el bloqueo por impago en tiempo real
        // (el SubscriptionInterceptor bloquea las escrituras si ya venció).
        paidUntil = dbUser.company.paidUntil ?? null;
      }
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role,
      companyId: payload.companyId,
      localId,
      paidUntil,
    };
  }
}
