import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra = "") {
  return [`btn-${variant}`, size === "lg" ? "btn-lg" : size === "sm" ? "btn-sm" : "", extra].filter(Boolean).join(" ");
}

type Common = { variant?: ButtonVariant; size?: ButtonSize; children: ReactNode; className?: string };

export function Button({ variant, size, className, type = "button", ...rest }: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}

/** A link styled as a button (navigation, not an action). */
export function ButtonLink({ variant, size, className, href, ...rest }: Common & { href: string } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <Link href={href} className={buttonClass(variant, size, className)} {...rest} />;
}
