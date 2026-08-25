import type { Metadata } from "next";

export function createCanonicalMetadata(path: string): Metadata {
  return { alternates: { canonical: path } };
}
