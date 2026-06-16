import Link from "next/link";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps {
  variant?: ButtonVariant;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}

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

export interface LinkButtonProps {
  variant?: ButtonVariant;
  children: React.ReactNode;
  href: string;
  className?: string;
}

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
