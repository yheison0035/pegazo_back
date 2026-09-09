import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/roles.decorator';
import { PlatformPaymentService } from './platform-payment.service';
import { UpdatePlatformPaymentDto } from './dto/update-platform-payment.dto';

@Controller('platform-payment')
@UseGuards(JwtAuthGuard)
export class PlatformPaymentController {
  constructor(private readonly service: PlatformPaymentService) {}

  // Lectura: cualquier usuario autenticado (para poder pagar).
  @Get('settings')
  get() {
    return this.service.get();
  }

  // Escritura: solo la plataforma.
  @UseGuards(RolesGuard)
  @Roles('SUPER_PLATFORM_ADMIN')
  @Put('settings')
  update(@Body() dto: UpdatePlatformPaymentDto) {
    return this.service.update(dto);
  }
}
