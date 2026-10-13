import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '@/auth/decorators/public.decorator';
import { InventoryService } from '../inventory.service';

// Catálogo público view-only por slug (negocios de productos) para /booking/:slug.
@Controller('public/catalog')
export class PublicCatalogController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Public()
  @Get(':slug')
  catalog(@Param('slug') slug: string) {
    return this.inventoryService.publicCatalog(slug);
  }
}
