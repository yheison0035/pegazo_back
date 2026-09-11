import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';

const KINDS = ['CLIENTE', 'PROVEEDOR', 'EMPLEADO', 'OTRO'];

@Injectable()
export class PartiesService {
  constructor(private prisma: PrismaService) {}

  async list(companyId: number, query: any = {}) {
    const where: any = { companyId };
    if (query.kind && KINDS.includes(String(query.kind).toUpperCase()))
      where.kind = String(query.kind).toUpperCase();
    const data = await this.prisma.party.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    return { success: true, data };
  }

  private normalize(dto: any) {
    const name = String(dto.name || '').trim();
    if (!name) throw new BadRequestException('El nombre es obligatorio.');
    const kind = String(dto.kind || 'OTRO').toUpperCase();
    if (!KINDS.includes(kind))
      throw new BadRequestException('Tipo de tercero no válido.');
    return {
      kind,
      name,
      docType: dto.docType ? String(dto.docType).toUpperCase().trim() : null,
      docNumber: dto.docNumber ? String(dto.docNumber).trim() : null,
      email: dto.email ? String(dto.email).trim() : null,
      phone: dto.phone ? String(dto.phone).trim() : null,
      address: dto.address ? String(dto.address).trim() : null,
      notes: dto.notes ? String(dto.notes).trim() : null,
    };
  }

  async create(companyId: number, dto: any) {
    const data = this.normalize(dto);
    const p = await this.prisma.party.create({ data: { companyId, ...data } });
    return { success: true, data: p };
  }

  async update(companyId: number, id: number, dto: any) {
    const p = await this.prisma.party.findFirst({ where: { id, companyId } });
    if (!p) throw new NotFoundException('Tercero no encontrado.');
    const data = this.normalize(dto);
    const updated = await this.prisma.party.update({
      where: { id },
      data: { ...data, active: dto.active === undefined ? p.active : !!dto.active },
    });
    return { success: true, data: updated };
  }

  async remove(companyId: number, id: number) {
    const p = await this.prisma.party.findFirst({ where: { id, companyId } });
    if (!p) throw new NotFoundException('Tercero no encontrado.');
    await this.prisma.party.delete({ where: { id } });
    return { success: true };
  }
}
