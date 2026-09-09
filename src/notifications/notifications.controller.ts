import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

// Notificaciones del usuario autenticado (cualquier rol). Solo lee/gestiona
// las suyas; no necesita RolesGuard.
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  list(@Req() req, @Query('limit') limit?: string) {
    return this.service.list(req.user, limit ? Number(limit) : undefined);
  }

  @Get('unread-count')
  unreadCount(@Req() req) {
    return this.service.unreadCount(req.user);
  }

  @Patch('read-all')
  markAllRead(@Req() req) {
    return this.service.markAllRead(req.user);
  }

  @Patch(':id/read')
  markRead(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.markRead(req.user, id);
  }
}
