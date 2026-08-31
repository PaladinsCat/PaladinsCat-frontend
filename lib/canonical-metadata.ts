/** Builds canonical metadata for player-facing pages.
 * The module preserves canonical data, asset, or metadata behavior used by existing callers.
 */
import type { Metadata } from "next";

/** Use createCanonicalMetadata to apply the module-specific champion data or asset behavior.
 * Contract: accepts its declared inputs and returns the documented value without changing caller-side state.
 */
export function createCanonicalMetadata(path: string): Metadata {
  return { alternates: { canonical: path } };
}
