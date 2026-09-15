import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

// Dirección guardada del cliente. Mismo formato que la tarjeta "Dirección de
// entrega" del checkout.
export class CreateCustomerAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  label?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  department: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  city: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  neighborhood: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  address: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressDetail?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateCustomerAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  neighborhood?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressDetail?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
