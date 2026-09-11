import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/roles.decorator';
import { AccountantService } from './accountant.service';

@Controller('accountant')
export class AccountantController {
  constructor(private readonly service: AccountantService) {}

  // Públicos: registro e inicio de sesión del contador.
  @Post('register')
  register(@Body() dto) {
    return this.service.register(dto);
  }

  @Post('login')
  login(@Body() dto) {
    return this.service.login(dto);
  }

  // Perfil del contador autenticado (incluye su llave).
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ACCOUNTANT')
  @Get('me')
  me(@Req() req) {
    return this.service.me(req.user.id);
  }
}
