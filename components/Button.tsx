/**
 * Render button.
 * refs: none
 */
import Link from "next/link";

/**
 * Define button variant as `"primary" | "secondary" | "ghost"`.
 * refs: none
 */
export type ButtonVariant = "primary" | "secondary" | "ghost";

/**
 * Describe button props with variant (optional), children, onClick (optional), disabled (optional), className (optional), type (optional).
 * refs: none
 */
export interface ButtonProps {
  variant?: ButtonVariant;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}

/**
 * Render button.
 * refs: none
 * I/O types: `{ variant = "primary", children, onClick, disabled, className = "", type = "button", }: ButtonProps -> JSX.Element`.
 */
export default function Button({
  variant = "primary",
  children,
  onClick,
  disabled,
  className = "",
  type = "button",
}: ButtonProps) {
  const variantClass = {
    primary: "pc-btn-primary",
    secondary: "pc-btn-secondary",
    ghost: "pc-btn-ghost",
  }[variant];

  return (
    <button
      type={type}
      className={`${variantClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

/**
 * Describe link button props with variant (optional), children, href, className (optional).
 * refs: none
 */
export interface LinkButtonProps {
  variant?: ButtonVariant;
  children: React.ReactNode;
  href: string;
  className?: string;
}

/**
 * Render link button.
 * refs: none
 * I/O types: `{ variant = "primary", children, href, className = "", }: LinkButtonProps -> JSX.Element`.
 */
export function LinkButton({
  variant = "primary",
  children,
  href,
  className = "",
}: LinkButtonProps) {
  const variantClass = {
    primary: "pc-btn-primary",
    secondary: "pc-btn-secondary",
    ghost: "pc-btn-ghost",
  }[variant];

  return (
    <Link href={href} className={`${variantClass} ${className}`}>
      {children}
    </Link>
  );
}
