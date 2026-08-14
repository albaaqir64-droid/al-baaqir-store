"use client";

import type { OrderStatus } from "../lib/orders";

const statusSteps: { key: OrderStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

export function OrderTimeline({ current }: { current: OrderStatus }) {
  const currentIndex = statusSteps.findIndex((step) => step.key === current);

  return (
    <div className="space-y-5 rounded-3xl border border-emerald-200 bg-slate-50 p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-950">Order progress</h3>
      <div className="space-y-4">
        {statusSteps.map((step, index) => {
          const isDone = index <= currentIndex;
          return (
            <div key={step.key} className="flex items-start gap-4">
              <div className={`mt-1 h-4 w-4 rounded-full border ${isDone ? "border-emerald bg-emerald" : "border-slate-300 bg-white"}`} />
              <div className="flex-1">
                <div className={`font-semibold ${isDone ? "text-slate-950" : "text-slate-600"}`}>{step.label}</div>
                <div className="text-sm text-slate-500">{isDone ? "Completed" : "Waiting"}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
