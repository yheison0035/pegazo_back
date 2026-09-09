import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { PushService } from '@/push/push.service';
import { AuditService } from '@/audit/audit.service';
import { CreateStockRequestDto } from './dto/create-stock-request.dto';
import { DecideStockRequestDto } from './dto/reject-stock-request.dto';

// Roles que aprueban/rechazan (y que bajan stock directamente): dueño y admin.
const APPROVER_ROLES = ['SUPER_ADMIN', 'ADMIN'];

interface RequestLine {
  variantId: number;
  sku: string;
  label: string;
  currentStock: number;
  requestedStock: number;
  delta: number; // negativo (disminución)
}

@Injectable()
export class StockRequestsService {
  constructor(
    private prisma: PrismaService,
    private push: PushService,
    private audit: AuditService,
  ) {}

  private isApprover(role: string) {
    return APPROVER_ROLES.includes(role);
  }

  // Crea una solicitud de disminución. La hacen los usuarios SIN permiso para
  // bajar stock (todos menos dueño/admin). El stock NO se toca hasta aprobar.
  async create(user: any, dto: CreateStockRequestDto) {
    if (this.isApprover(user.role)) {
      throw new BadRequestException(
        'El dueño y el administrador aplican los cambios directamente.',
      );
    }

    const inventory = await this.prisma.inventory.findFirst({
      where: { id: dto.inventoryId, companyId: user.companyId },
      select: {
        id: true,
        name: true,
        variants: {
          select: { id: true, stock: true, sku: true, color: true, size: true },
        },
      },
    });
    if (!inventory) throw new NotFoundException('Producto no encontrado');

    // Una sola solicitud pendiente por producto.
    const pending = await this.prisma.stockChangeRequest.findFirst({
      where: { inventoryId: inventory.id, status: 'PENDING' },
      select: { id: true },
    });
    if (pending) {
      throw new ConflictException(
        'Ya hay una solicitud pendiente para este producto.',
      );
    }

    const variantById = new Map(inventory.variants.map((v) => [v.id, v]));
    const lines: RequestLine[] = [];
    for (const l of dto.lines || []) {
      const v = variantById.get(l.variantId);
      if (!v) continue;
      const requested = Number(l.requestedStock);
      const delta = requested - v.stock;
      if (delta < 0) {
        lines.push({
          variantId: v.id,
          sku: v.sku,
          label: [v.color, v.size].filter(Boolean).join(' / ') || v.sku,
          currentStock: v.stock,
          requestedStock: requested,
          delta,
        });
      }
    }

    if (lines.length === 0) {
      throw new BadRequestException('No hay disminuciones que solicitar.');
    }

    const reason = (dto.reason || '').trim();
    if (reason.length < 3) {
      throw new BadRequestException('Explica el motivo de la disminución.');
    }

    const created = await this.prisma.stockChangeRequest.create({
      data: {
        companyId: user.companyId,
        inventoryId: inventory.id,
        reason,
        lines: lines as any,
        requestedById: user.id,
      },
    });

    // Avisar a dueño/administrador (push) — el badge/campana lo mantiene visible.
    const totalBaja = lines.reduce((s, l) => s + Math.abs(l.delta), 0);
    await this.push.sendToCompanyRoles(user.companyId, APPROVER_ROLES, {
      title: '📦 Solicitud de disminución de stock',
      body: `${user.name} pide bajar ${totalBaja} de "${inventory.name}". Motivo: ${reason}`,
      url: '/dashboard/inventory/stock-requests',
      tag: `stockreq-${created.id}`,
    });

    return { success: true, data: created };
  }

  // Lista para el aprobador (dueño/admin): por estado, más recientes primero.
  async list(user: any, status?: string) {
    if (!this.isApprover(user.role)) {
      throw new ForbiddenException('No autorizado');
    }
    const where: any = { companyId: user.companyId };
    if (status) where.status = status;
    const data = await this.prisma.stockChangeRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        inventory: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, name: true, role: true } },
        decidedBy: { select: { id: true, name: true } },
      },
    });
    return { success: true, data };
  }

  // Conteo de pendientes (para el badge de la campana).
  async pendingCount(user: any) {
    if (!this.isApprover(user.role)) return { success: true, data: { count: 0 } };
    const count = await this.prisma.stockChangeRequest.count({
      where: { companyId: user.companyId, status: 'PENDING' },
    });
    return { success: true, data: { count } };
  }

  // Solicitudes propias del usuario que las creó (para ver su estado).
  async mine(user: any) {
    const data = await this.prisma.stockChangeRequest.findMany({
      where: { companyId: user.companyId, requestedById: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { inventory: { select: { id: true, name: true } } },
    });
    return { success: true, data };
  }

  private async load(user: any, id: number) {
    const req = await this.prisma.stockChangeRequest.findFirst({
      where: { id, companyId: user.companyId },
      include: { inventory: { select: { id: true, name: true } } },
    });
    if (!req) throw new NotFoundException('Solicitud no encontrada');
    return req;
  }

  // Aprobar: aplica la disminución (por delta, respetando ventas concurrentes).
  async approve(user: any, id: number, dto: DecideStockRequestDto) {
    if (!this.isApprover(user.role)) {
      throw new ForbiddenException('No autorizado');
    }
    const req = await this.load(user, id);
    if (req.status !== 'PENDING') {
      throw new ConflictException('La solicitud ya fue resuelta.');
    }

    const lines = (req.lines as unknown as RequestLine[]) || [];
    await this.prisma.$transaction(async (tx) => {
      for (const l of lines) {
        const variant = await tx.inventoryVariant.findUnique({
          where: { id: l.variantId },
          select: { id: true, stock: true },
        });
        if (!variant) continue;
        // Aplica el delta pedido sobre el stock ACTUAL (por si hubo ventas).
        const next = Math.max(0, variant.stock + l.delta);
        await tx.inventoryVariant.update({
          where: { id: variant.id },
          data: { stock: next },
        });
      }
      await tx.stockChangeRequest.update({
        where: { id: req.id },
        data: {
          status: 'APPROVED',
          decidedById: user.id,
          decidedAt: new Date(),
          decisionNote: dto?.note?.trim() || null,
          seen: true,
        },
      });
    });

    await this.audit.log({
      entity: 'inventory',
      entityId: req.inventoryId,
      action: 'UPDATE',
      user,
      changes: {
        stockRequest: {
          from: 'PENDING',
          to: 'APPROVED',
          lines: lines.map(
            (l) => `${l.label}: ${l.currentStock} → ${l.requestedStock}`,
          ),
          reason: req.reason,
          requestedById: req.requestedById,
        },
      } as any,
    });

    // Avisar al solicitante.
    await this.push.sendToUser(req.requestedById, {
      title: '✅ Disminución aprobada',
      body: `Se aprobó la disminución de "${req.inventory.name}".`,
      url: '/dashboard/inventory',
      tag: `stockreq-${req.id}`,
    });

    return { success: true, message: 'Solicitud aprobada' };
  }

  // Rechazar: no se toca el stock.
  async reject(user: any, id: number, dto: DecideStockRequestDto) {
    if (!this.isApprover(user.role)) {
      throw new ForbiddenException('No autorizado');
    }
    const req = await this.load(user, id);
    if (req.status !== 'PENDING') {
      throw new ConflictException('La solicitud ya fue resuelta.');
    }

    await this.prisma.stockChangeRequest.update({
      where: { id: req.id },
      data: {
        status: 'REJECTED',
        decidedById: user.id,
        decidedAt: new Date(),
        decisionNote: dto?.note?.trim() || null,
        seen: true,
      },
    });

    await this.push.sendToUser(req.requestedById, {
      title: '❌ Disminución rechazada',
      body: `Se rechazó la disminución de "${req.inventory.name}".`,
      url: '/dashboard/inventory',
      tag: `stockreq-${req.id}`,
    });

    return { success: true, message: 'Solicitud rechazada' };
  }
}
