import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { PublicCatalogController } from './public/catalog.public.controller';
import { CloudinaryModule } from '@/cloudinary/cloudinary.module';
import { VariantsModule } from './variants/variants.module';
import { StockService } from './stock.service';
import { PlanLimitsModule } from '@/common/plan-limits.module';

@Module({
  controllers: [InventoryController, PublicCatalogController],
  providers: [InventoryService, StockService],
  imports: [CloudinaryModule, VariantsModule, PlanLimitsModule],
  exports: [StockService],
})
export class InventoryModule {}
