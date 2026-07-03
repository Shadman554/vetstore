import { Skeleton } from "@/components/ui/skeleton";
import { useSiteSettings } from "@/lib/use-site-settings";

interface SkeletonCardProps {
  index?: number;
}

export function SkeletonCard({ index = 0 }: SkeletonCardProps) {
  const { settings } = useSiteSettings();
  const colors = [settings.color1, settings.color2, settings.color3];
  const bg = colors[index % 3] + "33";

  return (
    <div className="overflow-hidden flex flex-col h-full rounded-3xl shadow-md bg-white dark:bg-card">
      <div className="aspect-[4/3] w-full" style={{ background: bg }} />
      <div className="p-4 flex-1 flex flex-col gap-3">
        <Skeleton className="h-5 w-3/4 rounded-full" />
        <Skeleton className="h-8 w-2/5 rounded-full" />
      </div>
      <div className="px-4 pb-4">
        <Skeleton className="h-11 w-full rounded-2xl" />
      </div>
    </div>
  );
}
