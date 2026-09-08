/**
 * Return Next metadata with the supplied path as its canonical alternate URL; perform no I/O.
 * Builds canonical metadata for player-facing pages.
 * refs: none
 */
import type { Metadata } from "next";

/**
 * Return Next metadata with the supplied path as its canonical alternate URL; perform no I/O.
 * refs: none
 * I/O types: `path: string -> Metadata`.
 */
export function createCanonicalMetadata(path: string): Metadata {
  return { alternates: { canonical: path } };
}
