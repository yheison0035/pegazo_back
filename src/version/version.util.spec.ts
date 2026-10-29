import { pickCommitSha } from './version.util';

describe('pickCommitSha', () => {
  it('prefiere el SHA de Railway y devuelve el corto de 7', () => {
    expect(pickCommitSha({ RAILWAY_GIT_COMMIT_SHA: 'd98669112345' })).toEqual({
      sha: 'd98669112345',
      short: 'd986691',
    });
  });
  it('cae a variables genéricas; sin nada → unknown', () => {
    expect(pickCommitSha({ GIT_COMMIT_SHA: ' b32baab00 ' }).short).toBe(
      'b32baab',
    );
    expect(pickCommitSha({ SOURCE_VERSION: 'abcdef0123' }).short).toBe(
      'abcdef0',
    );
    expect(pickCommitSha({})).toEqual({ sha: 'unknown', short: 'unknown' });
  });
});
