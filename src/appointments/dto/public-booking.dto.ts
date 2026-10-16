import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

// Reserva hecha por el CLIENTE desde la página pública /booking/:slug. No hay
// usuario autenticado: el cliente da su nombre y celular, y elige servicio,
// profesional, sede, fecha y hora.
export class PublicBookingDto {
  @IsDateString()
  date: string;

  @IsString()
  startTime: string;

  @IsInt()
  serviceId: number;

  @IsInt()
  barberId: number;

  @IsInt()
  localId: number;

  @IsString()
  customerName: string;

  @IsString()
  customerPhone: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
