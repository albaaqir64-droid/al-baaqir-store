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

  if (current === 'cancelled' || current === 'return_requested' || current === 'returned') {
    const isReturned = current === 'returned';
    const isReturnRequested = current === 'return_requested';

    return (
       <div className="space-y-5">
        <div className={`flex items-center gap-3 ${isReturned || isReturnRequested ? 'text-orange-600' : 'text-rose-600'}`}>
           <div className="h-2 w-2 rounded-full bg-current" />
           <span className="text-[11px] font-bold uppercase tracking-widest">
             {current === 'cancelled' ? 'Order Cancelled' : isReturnRequested ? 'Return Requested' : 'Order Returned'}
           </span>
        </div>
        <p className="text-[13px] text-[#777]">
          {current === 'cancelled'
            ? 'This order has been cancelled and will not be processed further.'
            : isReturnRequested
              ? 'A return has been requested for this order. Our team will review it shortly.'
              : 'This order has been returned.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {statusSteps.map((step, index) => {
        const isDone = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step.key} className="relative flex items-start gap-4">
            {index !== statusSteps.length - 1 && (
              <div className={`absolute left-[5px] top-[18px] w-[1px] h-[calc(100%-8px)] ${isDone ? 'bg-[#111]' : 'bg-[#e8e2d9]'}`} />
            )}

            <div className={`mt-[6px] h-[11px] w-[11px] rounded-full border z-10 transition-colors duration-300 ${
              isDone ? 'bg-[#111] border-[#111]' : 'bg-white border-[#e8e2d9]'
            }`} />

            <div className="flex-1 pb-2">
              <div className={`text-[12px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                isDone ? "text-[#151515]" : "text-[#aaa]"
              }`}>
                {step.label}
              </div>
              {isCurrent && (
                <div className="text-[10px] font-bold text-brand-green uppercase tracking-widest mt-1">Current Status</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
