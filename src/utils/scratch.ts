import { Vector3 } from 'three'

/**
 * Reusable scratch vectors so hot paths never allocate per frame
 * (CLAUDE.md: useFrame allocations → GC stutter).
 * Each module creates its own set — never share across concurrent users.
 */
export function createScratch() {
  return {
    v1: new Vector3(),
    v2: new Vector3(),
    v3: new Vector3(),
    v4: new Vector3(),
    v5: new Vector3(),
  }
}
