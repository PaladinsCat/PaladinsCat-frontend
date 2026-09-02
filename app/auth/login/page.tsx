/**
 * Define the auth login page responsibility boundary.
 * Coordinates auth login page data loading, authorization, and presentation.
 */
import { redirect } from "next/navigation";
import { LoginFailure } from "./login-failure";

type LoginSearchParams = Promise<{ redirect?: string; oidc_error?: string }>;

function safeReturnPath(value: string | undefined): string {
  return value?.startsWith("/") && !value.startsWith("//") && !value.startsWith("/auth/") && !value.startsWith("/admin") ? value : "/";
}

/** Render the login entry point with a validated post-authentication return path.  Returns: `Promise<React.JSX.Element>`. */
export default async function LoginPage({ searchParams }: { searchParams: LoginSearchParams }) {
  const params = await searchParams;
  const returnPath = safeReturnPath(params.redirect);
  const href = `/api/auth/oidc/login?return=${encodeURIComponent(returnPath)}`;
  if (params.oidc_error !== "1") redirect(href);
  return <LoginFailure href={href} />;
}
