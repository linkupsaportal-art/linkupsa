import { cn } from "@/lib/utils";

/**
 * Shared loading skeletons for admin route Suspense boundaries.
 *
 * These render INSTANTLY when navigating (the shell stays mounted, only the
 * page slot swaps), so the user never stares at a frozen old page while the
 * server fetches. Shapes mirror the real layouts closely enough to avoid a
 * jarring swap / layout shift.
 *
 * Pure CSS pulse (`animate-pulse`) — no JS, no images, near-zero cost.
 */

export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-[hsl(220_14%_70%/0.18)]",
        className,
      )}
    />
  );
}

/** Header block — eyebrow + big title + description line. */
export function HeaderSkeleton() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-5 lg:mb-6 pt-5 lg:pt-6">
      <div className="min-w-0 space-y-2.5">
        <Shimmer className="h-3 w-24 rounded" />
        <Shimmer className="h-9 w-64 max-w-[70vw] rounded-lg" />
        <Shimmer className="h-3.5 w-80 max-w-[80vw] rounded" />
      </div>
      <Shimmer className="h-12 w-44 rounded-2xl" />
    </div>
  );
}

/** Generic card grid (stat tiles). */
export function CardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-3xl bg-surface border border-[hsl(var(--hairline))] p-5"
        >
          <div className="flex items-center justify-between">
            <Shimmer className="size-10 rounded-xl" />
            <Shimmer className="h-4 w-12 rounded" />
          </div>
          <Shimmer className="mt-5 h-8 w-20 rounded" />
          <Shimmer className="mt-2 h-3.5 w-28 rounded" />
        </div>
      ))}
    </div>
  );
}

/** Table skeleton — toolbar row + N body rows. */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <Shimmer className="h-9 w-20 rounded-xl" />
          <Shimmer className="h-9 w-28 rounded-xl" />
          <Shimmer className="h-9 w-24 rounded-xl" />
        </div>
        <Shimmer className="h-9 w-48 rounded-xl" />
      </div>
      <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] overflow-hidden">
        <div className="h-11 bg-surface-2 border-b border-[hsl(var(--hairline))]" />
        <div className="divide-y divide-[hsl(var(--hairline))]">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <Shimmer className="h-4 w-16 rounded" />
              <div className="flex-1 space-y-1.5">
                <Shimmer className="h-3.5 w-40 max-w-[40%] rounded" />
                <Shimmer className="h-3 w-24 rounded" />
              </div>
              <Shimmer className="h-5 w-16 rounded-full" />
              <Shimmer className="h-5 w-20 rounded-full" />
              <Shimmer className="h-3.5 w-20 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** A stack of full-width content cards (settings / forms). */
export function PanelSkeleton({ blocks = 3 }: { blocks?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: blocks }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-5 space-y-3"
        >
          <div className="flex items-center gap-3">
            <Shimmer className="size-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Shimmer className="h-4 w-40 rounded" />
              <Shimmer className="h-3 w-64 max-w-[70%] rounded" />
            </div>
          </div>
          <Shimmer className="h-10 w-full rounded-xl" />
          <Shimmer className="h-10 w-2/3 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

/** Full dashboard skeleton — header + 8/4 split + analytics band. */
export function DashboardSkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-5">
        <div className="xl:col-span-8 grid gap-4 lg:gap-5">
          <Shimmer className="h-10 w-72 max-w-full rounded-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
            <Shimmer className="h-[180px] rounded-3xl" />
            <Shimmer className="h-[180px] rounded-3xl" />
            <Shimmer className="h-[180px] rounded-3xl" />
          </div>
          <Shimmer className="h-64 rounded-3xl" />
        </div>
        <div className="xl:col-span-4">
          <Shimmer className="h-[360px] rounded-3xl" />
        </div>
      </div>
      <div className="mt-6 lg:mt-8 space-y-4 lg:space-y-5">
        <CardsSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          <Shimmer className="lg:col-span-8 h-72 rounded-3xl" />
          <Shimmer className="lg:col-span-4 h-72 rounded-3xl" />
        </div>
      </div>
    </>
  );
}
