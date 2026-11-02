import {
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

// Reserva hecha por el CLIENTE desde la página pública /booking/:slug. No hay
// usuario autenticado: el cliente da su nombre completo, correo y celular, y
// elige servicio, profesional, sede, fecha y hora. El correo se usa para
// enviarle la confirmación y los recordatorios (3, 2 y 1 día antes).
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
  @MinLength(3)
  customerName: string;

  // El front lo exige siempre; aquí es opcional para no romper durante el
  // despliegue, pero si viene debe tener formato válido. Se usa para enviar
  // confirmación y recordatorios.
  @IsOptional()
  @IsEmail({}, { message: 'El correo no es válido.' })
  customerEmail?: string;

  @IsString()
  customerPhone: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
