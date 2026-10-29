// Identificador del build desplegado. Railway inyecta el SHA del commit en
// RAILWAY_GIT_COMMIT_SHA. Con un solo GET /version se comprueba qué commit está
// realmente corriendo en producción (verificación de despliegues).
export function pickCommitSha(env: Record<string, string | undefined> = {}) {
  const raw =
    env.RAILWAY_GIT_COMMIT_SHA || env.GIT_COMMIT_SHA || env.SOURCE_VERSION || '';
  const sha = String(raw).trim();
  return { sha: sha || 'unknown', short: sha ? sha.slice(0, 7) : 'unknown' };
}
