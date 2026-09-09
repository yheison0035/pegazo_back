import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { UpdatePlatformPaymentDto } from './dto/update-platform-payment.dto';

const DEFAULTS = {
  bankName: 'BANCOLOMBIA',
  accountType: 'AHORROS',
  accountNumber: '45544431912',
  accountHolder: 'YEISON ANDRES SUAREZ DIAZ',
  whatsappNumber: '3186356609',
  instructions: '' as string | null,
};

@Injectable()
export class PlatformPaymentService {
  constructor(private prisma: PrismaService) {}

  // Config global única (fila id=1). Si no existe, se crea con los datos actuales.
  async get() {
    let s = await this.prisma.platformPaymentSettings.findUnique({
      where: { id: 1 },
    });
    if (!s) {
      s = await this.prisma.platformPaymentSettings.create({
        data: { id: 1, ...DEFAULTS },
      });
    }
    return { success: true, data: s };
  }

  async update(dto: UpdatePlatformPaymentDto) {
    const data: any = {};
    if (dto.bankName !== undefined) data.bankName = dto.bankName.trim();
    if (dto.accountType !== undefined) data.accountType = dto.accountType.trim();
    if (dto.accountNumber !== undefined)
      data.accountNumber = dto.accountNumber.trim();
    if (dto.accountHolder !== undefined)
      data.accountHolder = dto.accountHolder.trim();
    if (dto.whatsappNumber !== undefined)
      data.whatsappNumber = dto.whatsappNumber.replace(/[^\d]/g, '');
    if (dto.instructions !== undefined)
      data.instructions = dto.instructions.trim() || null;

    const s = await this.prisma.platformPaymentSettings.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...DEFAULTS, ...data },
    });
    return { success: true, data: s };
  }
}
