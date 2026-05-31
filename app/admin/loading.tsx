import { DashboardSkeleton } from "@/components/admin/skeletons";

/** Instant dashboard skeleton shown while the server fetches analytics. */
export default function Loading() {
  return <DashboardSkeleton />;
}
