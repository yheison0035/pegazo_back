import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import {
  InvoiceType,
  PaymentMethod,
  PaymentStatus,
  SaleStatus,
} from '@prisma/client';

export class CreateSaleItemDto {
  @IsOptional()
  @IsInt()
  inventoryVariantId?: number;

  @IsOptional()
  @IsInt()
  serviceId?: number;

  // Cantidad: entero para productos por unidad, decimal para venta por peso (kg).
  @IsNumber()
  quantity: number;

  @IsOptional()
  discount?: number;

  // Precio unitario DINÁMICO por línea. Solo lo usa el módulo de Guarda Cascos
  // para el guardado (calculado por tiempo). Si no viene, la venta usa el precio
  // normal del producto/servicio — el resto de negocios NO lo envían, así que su
  // comportamiento no cambia.
  @IsOptional()
  @IsNumber()
  priceOverride?: number;
}

export class CreateSaleDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  // Método del catálogo administrable (opcional). Si llega, define el enum
  // `paymentMethod` (su comportamiento base) y se guarda para reportes.
  @IsOptional()
  @IsInt()
  paymentMethodCatalogId?: number;

  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus: PaymentStatus;

  @IsEnum(SaleStatus)
  @IsOptional()
  saleStatus?: SaleStatus;

  // Tipo de documento: NORMAL (tiquete/factura de venta) o ELECTRONICA (DIAN).
  // Solo lo envía el POS cuando la empresa tiene facturación electrónica activa;
  // el resto de ventas quedan en NORMAL (default del modelo).
  @IsEnum(InvoiceType)
  @IsOptional()
  invoiceType?: InvoiceType;

  // Opcional: venta de mostrador sin cliente => backend asigna Consumidor Final.
  @IsOptional()
  @IsInt()
  customerId?: number;

  @IsInt()
  localId: number;

  @IsInt()
  userId: number;

  @IsOptional()
  @IsDateString()
  saleDate?: string;

  // Vencimiento de la venta a crédito (fiado).
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  // Efectivo con el que pagó el cliente (para el cambio/vuelto en la factura).
  @IsOptional()
  @IsNumber()
  cashReceived?: number;

  // Plan separe (apartado): abono inicial que entrega el cliente al crear el
  // apartado. Se registra como primer SalePayment (y a caja si es efectivo).
  @IsOptional()
  @IsNumber()
  initialPayment?: number;

  // Venta sin comisión para el empleado (corte de cortesía / mal aplicado).
  @IsOptional()
  @IsBoolean()
  noCommission?: boolean;

  @IsArray()
  @IsNotEmpty({ each: true })
  items: CreateSaleItemDto[];
}
