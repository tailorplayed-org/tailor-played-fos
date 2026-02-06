import { describe, it, expect } from 'vitest';

// Test that @/ path alias resolves correctly
describe('Path alias resolution', () => {
  it('can import from @/lib using path alias', async () => {
    const lib = await import('@/lib');
    expect(lib).toBeDefined();
  });

  it('can import from @/types using path alias', async () => {
    const types = await import('@/types');
    expect(types).toBeDefined();
  });

  it('can import from @/hooks using path alias', async () => {
    const hooks = await import('@/hooks');
    expect(hooks).toBeDefined();
  });
});
