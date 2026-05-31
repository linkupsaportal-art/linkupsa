import { HeaderSkeleton, CardsSkeleton, TableSkeleton } from "@/components/admin/skeletons";

export default function Loading() {
  return (
    <>
      <HeaderSkeleton />
      <div className="space-y-4">
        <CardsSkeleton count={4} />
        <TableSkeleton rows={10} />
      </div>
    </>
  );
}
