import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/roles.decorator';
import { SupportService } from './support.service';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly service: SupportService) {}

  // ----- Negocio (cualquier usuario autenticado de una empresa) -----
  @Get()
  clientThread(@Req() req) {
    return this.service.clientThread(req.user);
  }

  @Post()
  clientSend(@Req() req, @Body('body') body: string) {
    return this.service.clientSend(req.user, body);
  }

  @Get('unread-count')
  clientUnread(@Req() req) {
    return this.service.clientUnread(req.user);
  }

  // ----- Plataforma (soporte) -----
  @UseGuards(RolesGuard)
  @Roles('SUPER_PLATFORM_ADMIN')
  @Get('threads')
  threads() {
    return this.service.threads();
  }

  @UseGuards(RolesGuard)
  @Roles('SUPER_PLATFORM_ADMIN')
  @Get('platform/unread-count')
  platformUnread() {
    return this.service.platformUnread();
  }

  @UseGuards(RolesGuard)
  @Roles('SUPER_PLATFORM_ADMIN')
  @Get('threads/:companyId')
  platformThread(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.platformThread(companyId);
  }

  @UseGuards(RolesGuard)
  @Roles('SUPER_PLATFORM_ADMIN')
  @Post('threads/:companyId')
  platformSend(
    @Req() req,
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body('body') body: string,
  ) {
    return this.service.platformSend(req.user, companyId, body);
  }
}
