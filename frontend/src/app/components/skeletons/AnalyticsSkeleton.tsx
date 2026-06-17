import { Skeleton } from "../ui/skeleton";

export default function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 border rounded-lg space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Charts Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Chart */}
        <div className="p-6 border rounded-lg space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-[300px] w-full" />
        </div>

        {/* Secondary Chart */}
        <div className="p-6 border rounded-lg space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>

      {/* Table Section Skeleton */}
      <div className="p-6 border rounded-lg space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
