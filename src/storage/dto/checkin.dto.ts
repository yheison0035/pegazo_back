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
  @IsString()
  customerName: string;

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

  // Hora de ingreso (por defecto ahora).
  @IsOptional()
  @IsDateString()
  checkInAt?: string;

  @IsOptional()
  @IsIn(['HORA', 'DIA', 'MENSUALIDAD'])
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
