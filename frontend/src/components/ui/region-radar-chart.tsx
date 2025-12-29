import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Map } from 'lucide-react';
import type { RegionActivityStats } from '@/lib/api';

interface RegionRadarChartProps {
  data: RegionActivityStats[];
}

const chartConfig = {
  activity: {
    label: 'Quests',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

export function RegionRadarChart({ data }: RegionRadarChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const chartData = data.map((region) => ({
    region: region.name,
    activity: region.completedThisMonth,
  }));

  return (
    <Card>
      <CardHeader className="pb-0 pt-4 px-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Map className="h-4 w-4" />
          By Region
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[180px]">
          <RadarChart data={chartData}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="region" tick={{ fontSize: 10 }} />
            <PolarGrid />
            <Radar dataKey="activity" fill="var(--color-activity)" fillOpacity={0.6} />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
