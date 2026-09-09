import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { Role } from '@prisma/client';
import { hasRole } from '@/common/role-check.util';
import { InventoryVariantSyncInput } from './dto/sync-inventory-variants.dto';
import { generateSku } from '../../../utils/sku.util';

@Injectable()
export class VariantsService {
  constructor(private prisma: PrismaService) {}

  async syncVariants(
    inventoryId: number,
    incoming: InventoryVariantSyncInput[],
    user: any,
    opts: { allowDecrease?: boolean } = {},
  ) {
    if (
      !hasRole(user.role, [
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.RECEPCIONISTA,
      ])
    ) {
      throw new BadRequestException('No tienes permisos');
    }

    // Solo dueño/administrador pueden BAJAR stock directamente. Para los demás
    // (allowDecrease=false) el stock nunca disminuye por esta vía: se conserva
    // (clamp) y las disminuciones van por la solicitud de aprobación aparte.
    const allowDecrease = opts.allowDecrease !== false;

    const inventory = await this.prisma.inventory.findUnique({
      where: { id: inventoryId },
      select: { id: true, name: true },
    });

    if (!inventory) {
      throw new NotFoundException('Inventario no encontrado');
    }

    const existing = await this.prisma.inventoryVariant.findMany({
      where: { inventoryId },
    });
    const existingById = new Map(existing.map((v) => [v.id, v]));

    const incomingIds = incoming.filter((v) => v.id).map((v) => v.id);

    for (const variant of existing) {
      if (!incomingIds.includes(variant.id)) {
        // Quitar una variante equivale a poner su stock en 0 (disminución).
        // Sin permiso para bajar, no se desactiva: se conserva tal cual.
        if (!allowDecrease && variant.isActive && variant.stock > 0) continue;
        await this.prisma.inventoryVariant.update({
          where: { id: variant.id },
          data: {
            isActive: false,
            stock: 0,
          },
        });
      }
    }

    for (const v of incoming.filter((v) => v.id)) {
      let nextStock = v.stock ?? 0;
      if (!allowDecrease) {
        const current = existingById.get(v.id as number)?.stock ?? 0;
        // Nunca por debajo del stock actual: solo se permite subir o dejar igual.
        nextStock = Math.max(Number(nextStock), current);
      }
      await this.prisma.inventoryVariant.update({
        where: { id: v.id },
        data: {
          color: v.color,
          size: v.size ?? null,
          isActive: true,
          stock: nextStock, // 🔥 permitir cero
        },
      });
    }

    for (const v of incoming.filter((v) => !v.id)) {
      const created = await this.prisma.inventoryVariant.create({
        data: {
          inventoryId,
          color: v.color,
          size: v.size ?? null,
          stock: v.stock ?? 0,
          sku: 'PENDING',
        },
      });

      const sku = generateSku(inventory.name, created.sequence, created.color);

      await this.prisma.inventoryVariant.update({
        where: { id: created.id },
        data: { sku },
      });
    }

    return true;
  }
}
