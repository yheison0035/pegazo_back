import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

// Ingreso (check-in) de un casco a custodia.
export class CheckInDto {
  // Nombre opcional: se puede identificar SOLO por placa.
  @IsOptional()
  @IsString()
  customerName?: string;

  // Placa del vehículo (identificación sin datos personales). 5–7 alfanuméricos.
  @IsOptional()
  @Matches(/^[A-Za-z0-9]{5,7}$/, {
    message: 'La placa no es válida (ej: ABC12D).',
  })
  plate?: string;

  // Celular colombiano: 10 dígitos y empieza por 3.
  @IsOptional()
  @Matches(/^3\d{9}$/, {
    message: 'El celular debe tener 10 dígitos y empezar por 3.',
  })
  customerPhone?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsOptional()
  @IsInt()
  customerId?: number;

  // Quién recibe el casco (asesor/usuario a cargo). Si no viene, el que registra.
  @IsOptional()
  @IsInt()
  receivedById?: number;

  // Hora de ingreso (por defecto ahora).
  @IsOptional()
  @IsDateString()
  checkInAt?: string;

  @IsOptional()
  @IsIn(['HORA', 'DIA', 'SEMANA', 'MENSUALIDAD'])
  billingMode?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  helmetCount?: number;

  @IsOptional()
  @IsBoolean()
  washRequested?: boolean;

  // Cuántos de los cascos se van a lavar (0 = ninguno). Si no viene y
  // washRequested es true, se lavan todos.
  @IsOptional()
  @IsInt()
  @Min(0)
  washCount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
