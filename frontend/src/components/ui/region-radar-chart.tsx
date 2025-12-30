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

  // Calculate dynamic outer radius based on number of regions
  // More regions = smaller radar to leave room for labels
  const outerRadius = data.length <= 3 ? '60%' : data.length <= 5 ? '55%' : '50%';

  return (
    <Card>
      <CardHeader className="pb-0 pt-4 px-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Map className="h-4 w-4" />
          By Region
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[200px]">
          <RadarChart
            data={chartData}
            outerRadius={outerRadius}
            margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
          >
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis
              dataKey="region"
              tick={({ x, y, payload, textAnchor }) => (
                <text
                  x={x}
                  y={y}
                  textAnchor={textAnchor}
                  dominantBaseline="central"
                  className="fill-muted-foreground text-[10px]"
                >
                  {payload.value}
                </text>
              )}
            />
            <PolarGrid />
            <Radar dataKey="activity" fill="var(--color-activity)" fillOpacity={0.6} />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
