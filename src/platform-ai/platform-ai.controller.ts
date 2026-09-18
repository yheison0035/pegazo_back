import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/roles.decorator';
import { PlatformAiService } from './platform-ai.service';
import {
  GenerateProductContentDto,
  UpdatePlatformAiDto,
} from './dto/update-platform-ai.dto';

@Controller('platform-ai')
@UseGuards(JwtAuthGuard)
export class PlatformAiController {
  constructor(private readonly service: PlatformAiService) {}

  // Lectura de la config (sin exponer la key): solo la plataforma.
  @UseGuards(RolesGuard)
  @Roles('SUPER_PLATFORM_ADMIN')
  @Get('settings')
  get() {
    return this.service.get();
  }

  // Escritura de la config: solo la plataforma.
  @UseGuards(RolesGuard)
  @Roles('SUPER_PLATFORM_ADMIN')
  @Put('settings')
  update(@Body() dto: UpdatePlatformAiDto) {
    return this.service.update(dto);
  }

  // Estado simple para el CRM (¿está la IA lista para usarse?). Cualquier usuario
  // autenticado que crea productos puede consultarlo para mostrar/ocultar el botón.
  @UseGuards(RolesGuard)
  @Roles(
    'SUPER_PLATFORM_ADMIN',
    'SUPER_ADMIN',
    'ADMIN',
    'COORDINADOR',
    'AUXILIAR',
    'ASESOR',
    'BODEGUERO',
    'RECEPCIONISTA',
  )
  @Get('status')
  async status() {
    const s = await this.service.get();
    return { available: s.enabled && s.hasKey };
  }

  // Generación de contenido de producto a partir del nombre (botón IA).
  @UseGuards(RolesGuard)
  @Roles(
    'SUPER_PLATFORM_ADMIN',
    'SUPER_ADMIN',
    'ADMIN',
    'COORDINADOR',
    'AUXILIAR',
    'ASESOR',
    'BODEGUERO',
    'RECEPCIONISTA',
  )
  @Post('generate/product')
  generate(@Body() dto: GenerateProductContentDto) {
    return this.service.generateProductContent(dto);
  }
}
