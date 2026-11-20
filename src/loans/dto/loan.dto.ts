import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export const LOAN_FREQ = ['DIARIA', 'SEMANAL', 'QUINCENAL', 'MENSUAL'] as const;
export const LOAN_AMORT = ['SIMPLE', 'FRANCES', 'ALEMAN'] as const;
export const RATE_CONV = ['PROPORCIONAL', 'EFECTIVA'] as const;
export const ALLOC = ['MORA', 'INTERES', 'CAPITAL'] as const;

// Términos que se pueden fijar al simular o crear. Todo opcional: lo que no
// venga se resuelve en cascada (cliente → producto → empresa).
export class LoanTermsDto {
  @IsNumber() @Min(1)
  principal: number;

  @IsInt() @Min(1) @Max(1000)
  termCount: number;

  @IsOptional() @IsIn(LOAN_FREQ as unknown as string[])
  frequency?: (typeof LOAN_FREQ)[number];

  @IsOptional() @IsIn(LOAN_AMORT as unknown as string[])
  amortization?: (typeof LOAN_AMORT)[number];

  @IsOptional() @IsNumber() @Min(0) @Max(1000)
  interestRate?: number; // % mensual (override)

  @IsOptional() @IsNumber() @Min(0) @Max(1000)
  moraRate?: number; // % mensual (override)

  @IsOptional() @IsInt() @Min(0) @Max(365)
  graceDays?: number;

  @IsOptional() @IsInt() @Min(1) @Max(1000000)
  roundTo?: number;

  @IsOptional() @IsDateString()
  disbursementDate?: string;

  @IsOptional() @IsDateString()
  firstDueDate?: string;

  @IsOptional() @IsInt()
  customerId?: number;

  @IsOptional() @IsInt()
  productId?: number;
}

export class SimulateLoanDto extends LoanTermsDto {}

export class CreateLoanDto extends LoanTermsDto {
  @IsInt()
  declare customerId: number;

  @IsOptional() @IsInt()
  collectorId?: number;

  @IsOptional() @IsInt()
  localId?: number;

  @IsOptional() @IsString() @MaxLength(1000)
  notes?: string;

  // Desembolsar en el mismo paso (si la empresa no exige aprobación).
  @IsOptional() @IsBoolean()
  disburseNow?: boolean;

  @IsOptional() @IsEnum(PaymentMethod)
  disbursementMethod?: PaymentMethod;

  // Permite superar el cupo del cliente (solo dueño/administrador).
  @IsOptional() @IsBoolean()
  force?: boolean;
}

export class DisburseLoanDto {
  @IsOptional() @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional() @IsDateString()
  disbursementDate?: string;

  @IsOptional() @IsDateString()
  firstDueDate?: string;
}

export class ReasonDto {
  @IsOptional() @IsString() @MaxLength(500)
  reason?: string;
}

export class LoanPaymentDto {
  @IsNumber() @Min(1)
  amount: number;

  @IsOptional() @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional() @IsDateString()
  paidAt?: string;

  @IsOptional() @IsString() @MaxLength(500)
  note?: string;

  // Abonar primero a una cuota concreta (número).
  @IsOptional() @IsInt() @Min(1)
  targetInstallmentNumber?: number;
}

export class LoanProductDto {
  @IsString() @MaxLength(120)
  name: string;

  @IsOptional() @IsString() @MaxLength(500)
  description?: string;

  @IsNumber() @Min(0) @Max(1000)
  interestRate: number;

  @IsOptional() @IsNumber() @Min(0) @Max(1000)
  moraRate?: number | null;

  @IsOptional() @IsInt() @Min(0) @Max(365)
  graceDays?: number;

  @IsOptional() @IsIn(LOAN_FREQ as unknown as string[])
  frequency?: (typeof LOAN_FREQ)[number];

  @IsOptional() @IsIn(LOAN_AMORT as unknown as string[])
  amortization?: (typeof LOAN_AMORT)[number];

  @IsOptional() @IsInt() @Min(1)
  minTerm?: number | null;

  @IsOptional() @IsInt() @Min(1)
  maxTerm?: number | null;

  @IsOptional() @IsNumber() @Min(0)
  minAmount?: number | null;

  @IsOptional() @IsNumber() @Min(0)
  maxAmount?: number | null;

  @IsOptional() @IsInt() @Min(1)
  roundTo?: number;

  @IsOptional() @IsIn(['ACTIVO', 'INACTIVO'])
  status?: 'ACTIVO' | 'INACTIVO';
}

export class CreditProfileDto {
  @IsOptional() @IsInt()
  productId?: number | null;

  @IsOptional() @IsNumber() @Min(0) @Max(1000)
  customRate?: number | null;

  @IsOptional() @IsNumber() @Min(0)
  creditLimit?: number | null;

  @IsOptional() @IsString() @MaxLength(20)
  riskCategory?: string | null;

  @IsOptional() @IsInt() @Min(0) @Max(1000)
  score?: number | null;

  @IsOptional() @IsNumber() @Min(0)
  monthlyIncome?: number | null;

  @IsOptional() @IsString() @MaxLength(120)
  occupation?: string | null;

  @IsOptional() @IsString() @MaxLength(160)
  workplace?: string | null;

  @IsOptional() @IsArray() @ArrayMaxSize(10)
  references?: { name?: string; phone?: string; relation?: string }[] | null;

  @IsOptional() @IsString() @MaxLength(160)
  guarantorName?: string | null;

  @IsOptional() @IsString() @MaxLength(40)
  guarantorDocument?: string | null;

  @IsOptional() @IsString() @MaxLength(40)
  guarantorPhone?: string | null;

  @IsOptional() @IsString() @MaxLength(200)
  guarantorAddress?: string | null;

  @IsOptional() @IsInt()
  collectorId?: number | null;

  @IsOptional() @IsBoolean()
  blocked?: boolean;

  @IsOptional() @IsString() @MaxLength(1000)
  notes?: string | null;
}

export class LoanSettingsDto {
  @IsOptional() @IsNumber() @Min(0) @Max(1000)
  defaultInterestRate?: number;

  @IsOptional() @IsNumber() @Min(0) @Max(1000)
  defaultMoraRate?: number | null;

  @IsOptional() @IsInt() @Min(0) @Max(365)
  graceDays?: number;

  @IsOptional() @IsIn(LOAN_FREQ as unknown as string[])
  defaultFrequency?: (typeof LOAN_FREQ)[number];

  @IsOptional() @IsIn(LOAN_AMORT as unknown as string[])
  defaultAmortization?: (typeof LOAN_AMORT)[number];

  @IsOptional() @IsIn(RATE_CONV as unknown as string[])
  rateConversion?: (typeof RATE_CONV)[number];

  @IsOptional() @IsInt() @Min(1) @Max(1000000)
  roundTo?: number;

  @IsOptional() @IsBoolean()
  requireApproval?: boolean;

  @IsOptional() @IsArray() @ArrayMaxSize(6)
  excludeWeekdays?: number[];

  @IsOptional() @IsArray() @ArrayMaxSize(3)
  allocationOrder?: (typeof ALLOC)[number][];

  @IsOptional() @IsNumber() @Min(0) @Max(1000)
  usuryRateMonthly?: number | null;

  @IsOptional() @IsBoolean()
  collectorCanRegisterPayments?: boolean;

  @IsOptional() @IsBoolean()
  requireCashForDisbursement?: boolean;

  @IsOptional() @IsInt() @Min(1) @Max(1000)
  maxTerm?: number | null;

  @IsOptional() @IsNumber() @Min(0)
  minAmount?: number | null;

  @IsOptional() @IsNumber() @Min(0)
  maxAmount?: number | null;

  // Recordatorio de cuota al cliente por correo (cron diario).
  @IsOptional() @IsBoolean()
  remindersEnabled?: boolean;

  @IsOptional() @IsInt() @Min(0) @Max(60)
  reminderDaysBefore?: number;

  // Aviso interno/push de mora al dueño y a cada cobrador (cron diario).
  @IsOptional() @IsBoolean()
  alertsEnabled?: boolean;
}

// ---------------------------------------------------------------------------
// FASE 2
// ---------------------------------------------------------------------------
export const REAMORTIZE_MODES = ['REDUCE_INSTALLMENT', 'REDUCE_TERM'] as const;

// Abono extraordinario a capital (préstamo al día).
export class ExtraCapitalDto {
  @IsNumber() @Min(1)
  amount: number;

  @IsIn(REAMORTIZE_MODES as unknown as string[])
  mode: (typeof REAMORTIZE_MODES)[number];

  @IsOptional() @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional() @IsDateString()
  paidAt?: string;

  @IsOptional() @IsString() @MaxLength(500)
  note?: string;
}

// Liquidación anticipada (saldar hoy).
export class SettleLoanDto {
  @IsOptional() @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional() @IsDateString()
  paidAt?: string;

  @IsOptional() @IsString() @MaxLength(500)
  note?: string;
}

// Refinanciar: la deuda a hoy pasa a un préstamo nuevo con términos nuevos.
export class RefinanceLoanDto {
  @IsInt() @Min(1) @Max(1000)
  termCount: number;

  @IsOptional() @IsIn(LOAN_FREQ as unknown as string[])
  frequency?: (typeof LOAN_FREQ)[number];

  @IsOptional() @IsIn(LOAN_AMORT as unknown as string[])
  amortization?: (typeof LOAN_AMORT)[number];

  @IsOptional() @IsNumber() @Min(0) @Max(1000)
  interestRate?: number;

  @IsOptional() @IsDateString()
  firstDueDate?: string;

  // Perdonar la mora acumulada al refinanciar.
  @IsOptional() @IsBoolean()
  forgiveMora?: boolean;

  @IsOptional() @IsString() @MaxLength(1000)
  notes?: string;
}
