import { Children, cloneElement, isValidElement } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md";

type ButtonProps = {
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-slate-900 text-white shadow-sm hover:bg-slate-800 hover:shadow-md hover:ring-1 hover:ring-black/10 active:shadow-sm focus-visible:ring-2 focus-visible:ring-slate-400/50 focus-visible:ring-offset-2",
  secondary:
    "border border-slate-300 bg-white text-slate-900 shadow-sm hover:border-slate-400 hover:bg-slate-50 hover:shadow-md active:shadow-sm focus-visible:ring-2 focus-visible:ring-slate-300/50 focus-visible:ring-offset-2",
  ghost:
    "bg-transparent text-slate-900 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-300/50 focus-visible:ring-offset-2",
  destructive:
    "bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md active:shadow-sm focus-visible:ring-2 focus-visible:ring-red-400/50 focus-visible:ring-offset-2",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 rounded-xl px-3 text-sm font-medium",
  md: "h-11 rounded-xl px-6 text-sm font-medium",
};

const baseClasses =
  "inline-flex items-center justify-center whitespace-nowrap outline-none transition-[box-shadow,background-color,border-color,color] duration-200 ease-out disabled:pointer-events-none disabled:opacity-50";

export function Button({
  asChild = false,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(baseClasses, variantClasses[variant], sizeClasses[size], className);

  if (asChild && isValidElement(children)) {
    const child = Children.only(children);
    return cloneElement(child, {
      className: cn((child.props as { className?: string }).className, classes),
      ...props,
    });
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
