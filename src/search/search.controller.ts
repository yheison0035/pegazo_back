import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { SearchService } from './search.service';

// Buscador global del CRM. Cualquier usuario autenticado de la empresa puede
// consultarlo; el servicio ya filtra por local accesible y oculta el precio de
// compra según el rol.
@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('quick')
  quick(@Req() req, @Query('term') term: string) {
    return this.searchService.quick(req.user, term);
  }
}
