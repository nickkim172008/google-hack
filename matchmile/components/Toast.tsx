"use client";

/** Generic floating notice — replay events and app messages (e.g. geolocation
 *  failures) both surface here so judges see every change land. */
export interface ToastNotice {
  id: string;
  icon: string;
  title: string;
  detail?: string;
}

export default function Toast({ notice }: { notice: ToastNotice | null }) {
  if (!notice) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-4 z-[1200] w-[min(92vw,420px)] -translate-x-1/2">
      <div
        key={notice.id}
        className="animate-toast flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-2xl shadow-slate-900/20 backdrop-blur-md dark:border-white/15 dark:bg-slate-900/90 dark:shadow-black/50"
        role="status"
        aria-live="polite"
      >
        <span aria-hidden className="mt-0.5 text-lg leading-none">
          {notice.icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-900 dark:text-white">{notice.title}</p>
          {notice.detail && (
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-white/60">
              {notice.detail}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
