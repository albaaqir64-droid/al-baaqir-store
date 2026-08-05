"use client";

type ToastProps = {
  message: string;
  variant?: "success" | "error" | "info";
};

const variantStyles: Record<NonNullable<ToastProps["variant"]>, string> = {
  success: "bg-emerald-600 border-emerald-200 text-white",
  error: "bg-rose-600 border-rose-200 text-white",
  info: "bg-slate-900 border-slate-200 text-white",
};

export function Toast({ message, variant = "success" }: ToastProps) {
  return (
    <div className={`fixed right-6 bottom-6 z-50 max-w-sm rounded-3xl border px-5 py-4 shadow-2xl ${variantStyles[variant]}`}>
      <p className="text-sm font-semibold">{message}</p>
    </div>
  );
}
