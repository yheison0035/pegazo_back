import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '@/prisma.service';
import { PurchasesService, payableAmountFor } from './purchases.service';

describe('payableAmountFor', () => {
  it('total menos retenciones, nunca negativo', () => {
    expect(
      payableAmountFor({ total: 1190000, retefuente: 25000, reteica: 4140 }),
    ).toBe(1160860);
    expect(payableAmountFor({ total: 1000, retefuente: 2000 })).toBe(0);
    expect(payableAmountFor({ total: '119000.4' })).toBe(119000);
    expect(payableAmountFor({})).toBe(0);
  });
});

// Al RECIBIR una compra: entra el stock, se actualiza el costo del producto y
// nace automáticamente la cuenta por pagar (tipo PEDIDOS) al proveedor.
describe('PurchasesService.receive', () => {
  const tx: any = {
    inventoryVariant: {
      update: jest.fn(),
      findUnique: jest.fn().mockResolvedValue({ inventoryId: 5 }),
    },
    inventory: { update: jest.fn() },
    purchase: { update: jest.fn() },
    payable: { create: jest.fn() },
  };
  const prisma: any = {
    purchase: { findFirst: jest.fn() },
    $transaction: jest.fn((cb: any) => cb(tx)),
  };
  let svc: PurchasesService;
  const user = { id: 9, name: 'Dueño', companyId: 1 };
  const base = {
    id: 3,
    code: 'COMPRA-1',
    status: 'PENDIENTE',
    localId: 2,
    total: 1190000,
    retefuente: 25000,
    reteica: 4140,
    provider: { name: 'Distrimax' },
    items: [{ inventoryVariantId: 10, quantity: 4, unitCost: 25000 }],
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await Test.createTestingModule({
      providers: [
        PurchasesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    svc = mod.get(PurchasesService);
    jest.spyOn(svc as any, 'findOne').mockResolvedValue({ success: true });
  });

  it('crea la cuenta por pagar PEDIDOS por total menos retenciones, con el proveedor', async () => {
    prisma.purchase.findFirst.mockResolvedValue({ ...base });
    await svc.receive(user, 3);
    expect(tx.inventoryVariant.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { stock: { increment: 4 } },
    });
    expect(tx.inventory.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { purchasePrice: 25000 },
    });
    expect(tx.payable.create).toHaveBeenCalledTimes(1);
    expect(tx.payable.create.mock.calls[0][0].data).toMatchObject({
      companyId: 1,
      localId: 2,
      concept: 'Compra COMPRA-1',
      paidTo: 'Distrimax',
      type: 'PEDIDOS',
      amount: 1160860,
      dueDate: null,
      createdById: 9,
    });
  });

  it('si no queda nada por pagar (p. ej. total 0) no crea cuenta por pagar', async () => {
    prisma.purchase.findFirst.mockResolvedValue({
      ...base,
      total: 0,
      retefuente: 0,
      reteica: 0,
    });
    await svc.receive(user, 3);
    expect(tx.payable.create).not.toHaveBeenCalled();
  });

  it('no se puede recibir dos veces ni una cancelada', async () => {
    prisma.purchase.findFirst.mockResolvedValue({
      ...base,
      status: 'RECIBIDA',
    });
    await expect(svc.receive(user, 3)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    prisma.purchase.findFirst.mockResolvedValue({
      ...base,
      status: 'CANCELADA',
    });
    await expect(svc.receive(user, 3)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(tx.payable.create).not.toHaveBeenCalled();
  });
});
