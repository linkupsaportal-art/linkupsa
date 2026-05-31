import { HeaderSkeleton, PanelSkeleton } from "@/components/admin/skeletons";

export default function Loading() {
  return (
    <>
      <HeaderSkeleton />
      <PanelSkeleton blocks={4} />
    </>
  );
}
