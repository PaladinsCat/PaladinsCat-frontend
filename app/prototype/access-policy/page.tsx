/**
 * Expose the production access-enforcement surface for visual QA.
 * Owns no policy state; the application gate supplies the same surface for restricted sessions.
 * refs:
 * - doc: documents/01-foundations/commenting-standard.md
 * - doc: documents/06-reference/design/frontend-design-system.md
 */
import { RestrictedAccountSurface } from "@/components/restricted-account-gate";

/**
 * Render the access-enforcement prototype.
 * Contract: returns the shared neutral restriction surface and exposes no policy details.
 * refs:
 * - doc: documents/06-reference/design/frontend-design-system.md
 * I/O types: `none -> JSX.Element`.
 */
export default function AccessPolicyPrototype() {
  return <RestrictedAccountSurface />;
}
