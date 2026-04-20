import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type StatsCardProps = {
  title: string;
  description: string;
  value: number | string;
  icon: LucideIcon;
  iconClassName: string;
};

export function StatsCard({
  title,
  description,
  value,
  icon: Icon,
  iconClassName,
}: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-4">
        <div
          className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full ${iconClassName}`}
        >
          <Icon className="size-5" />
        </div>
        <div className="space-y-1.5">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
