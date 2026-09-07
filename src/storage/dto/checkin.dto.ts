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

  @IsOptional()
  @IsString()
  notes?: string;
}
