import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsEmail,
  IsBoolean,
  IsInt,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { Status } from '@prisma/client';

export class CreateCompanyDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsBoolean()
  websiteEnabled?: boolean;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  manager?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsString()
  billingMode?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  monthlyPrice?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  paymentDay?: number | null;

  @IsOptional()
  @IsDateString()
  paidUntil?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  // Facturación electrónica DIAN: se puede habilitar desde el alta de la empresa
  // (o después, en editar). Si queda apagado, la empresa no ve nada de DIAN.
  @IsOptional()
  @IsBoolean()
  electronicInvoicingEnabled?: boolean;

  // Empresa de pruebas (sandbox DIAN = entorno HABILITACION). No controla la
  // visibilidad del módulo, solo el entorno contra el que se emite.
  @IsOptional()
  @IsBoolean()
  isTestCompany?: boolean;

  // Credenciales del usuario administrador inicial de la empresa (para que
  // pueda loguear y de ahí en adelante gestione todo por su cuenta).
  @IsOptional()
  @IsString()
  adminName?: string;

  @IsOptional()
  @IsEmail()
  adminEmail?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  adminPassword?: string;
}
