"use client";

export function LoadingSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="h-4 rounded-full bg-slate-200/70 dark:bg-slate-700/70 animate-pulse" />
      ))}
    </div>
  );
}
