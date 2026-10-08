"use client";

import { useEffect } from "react";
import { setFingerprintCookie } from "@/lib/fingerprint";

/**
 * Sets the first-party browser-fingerprint cookie on first client mount so it
 * is present for subsequent requests, including the OIDC login callback
 * (a top-level navigation that cannot carry custom request headers).
 *
 * Coarse, pseudonymized device characteristics only (screen, timezone,
 * platform) — no pixel-level, geolocation, or storage-derived values. The
 * backend hashes these into a versioned browser signature and never stores
 * the raw values.
 *
 * refs: doc: documents/02-technical/security/security-access-capture.md
 */
export default function FingerprintBootstrap() {
  useEffect(() => {
    setFingerprintCookie();
  }, []);
  return null;
}
