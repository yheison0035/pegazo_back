import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export class CheckoutProductDto {
  @IsInt()
  inventoryVariantId: number;

  @IsNumber()
  quantity: number;
}

// Cobro y entrega del casco: genera la venta (guardado + lavado + productos).
export class CheckoutDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsInt()
  paymentMethodCatalogId?: number;

  // Incluir el lavado en la factura (por defecto, lo que pidió el ticket).
  @IsOptional()
  @IsBoolean()
  includeWash?: boolean;

  // Productos adicionales que se lleva el cliente.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutProductDto)
  products?: CheckoutProductDto[];

  @IsOptional()
  @IsNumber()
  cashReceived?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
