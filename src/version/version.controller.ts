import { Controller, Get } from '@nestjs/common';
import { Public } from '@/auth/decorators/public.decorator';
import { pickCommitSha } from './version.util';

// GET /version → { sha, short, env }. Público y sin datos sensibles: solo
// identifica el commit desplegado para verificar despliegues.
@Controller('version')
export class VersionController {
  @Public()
  @Get()
  get() {
    return {
      ...pickCommitSha(process.env),
      env:
        process.env.RAILWAY_ENVIRONMENT_NAME || process.env.NODE_ENV || 'local',
    };
  }
}
