import { Skeleton } from "@/shared/components/ui/skeleton";

export function RecipeCardSkeleton() {
  return (
    <div
      className="mb-3 rounded-xl border border-border bg-card p-4 shadow-sm md:p-5"
      aria-hidden="true"
    >
      <Skeleton className="mb-2 h-6 w-2/3" />
      <div className="flex gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}
