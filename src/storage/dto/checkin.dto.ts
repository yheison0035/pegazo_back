import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

// Ingreso (check-in) de un casco a custodia.
export class CheckInDto {
  @IsString()
  customerName: string;

  @IsOptional()
  @IsString()
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
