import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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

  // Lo llama el cliente cuando una cita entra en la ventana de recordatorio.
  @Post('appointment-reminder')
  appointmentReminder(@Req() req, @Body('appointmentId') appointmentId: number) {
    return this.service.createAppointmentReminder(req.user, appointmentId);
  }

  // Lo llama el cliente al iniciar sesión / cargar el panel: crea (idempotente)
  // el aviso de vencimiento del plan si faltan ≤ 3 días.
  @Post('subscription-due')
  subscriptionDue(@Req() req) {
    return this.service.createSubscriptionDueNotice(req.user);
  }
}
