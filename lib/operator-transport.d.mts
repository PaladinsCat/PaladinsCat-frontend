import type { X509Certificate } from "node:crypto";
export function readOperatorMaterial(name: string): Buffer;
export function parseOperatorCertificates(bytes: Buffer, caRequired: boolean): X509Certificate[];
export function operatorBackendFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
