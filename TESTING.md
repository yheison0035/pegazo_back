# Pruebas — reglas del proyecto

Un módulo **no está terminado** hasta que:

1. Su lógica pura tiene **tests unitarios** (`*.spec.ts` junto al archivo).
2. Su servicio tiene tests con **Prisma simulado** (sin base de datos) — plantilla: `src/common/plan-limits.service.spec.ts`.
3. Si toca **dinero, stock o datos del cliente**, tiene al menos un test de integración o de punta a punta.
4. Se probó con **al menos 3 tipos de negocio** (retail, por peso, servicios/citas; comida si aplica).
5. **CI en verde** (`.github/workflows/ci.yml` corre tests + build en cada push/PR).

## Comandos

- `npm test` — corre todo.
- `npm run test:watch` — en desarrollo.
- `npm run test:cov` — cobertura (carpeta `coverage/`).
- `npm run test:ci` — como en CI.

## Cómo simular Prisma

```ts
const prisma = { company: { findUnique: jest.fn() } };
const mod = await Test.createTestingModule({
  providers: [MiServicio, { provide: PrismaService, useValue: prisma }],
}).compile();
```

Importa con alias `@/...` (ya mapeado en Jest). Los `*.spec.ts` quedan fuera del build (`tsconfig.build.json`).
