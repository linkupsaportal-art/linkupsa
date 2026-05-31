import { HeaderSkeleton, TableSkeleton } from "@/components/admin/skeletons";

export default function Loading() {
  return (
    <>
      <HeaderSkeleton />
      <TableSkeleton rows={8} />
    </>
  );
}
