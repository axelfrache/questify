import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Map } from 'lucide-react';
import type { CategoryStatsResponse } from '@/lib/api';

interface RegionRadarChartProps {
  data: CategoryStatsResponse[];
}

const chartConfig = {
  activity: {
    label: 'Quests',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

export function RegionRadarChart({ data }: RegionRadarChartProps) {
  const hasData = data && data.length > 0;

  const chartData = hasData
    ? data.map((region) => ({
        region: region.categoryName,
        activity: region.questsCompleted,
      }))
    : [];

  const outerRadius = data.length <= 3 ? '55%' : data.length <= 5 ? '50%' : '45%';

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-0 pt-4 px-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Map className="h-4 w-4" />
          By Region
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 flex-1 flex items-center justify-center min-h-[180px] max-h-[240px] overflow-hidden">
        {hasData ? (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square h-full max-h-[180px] w-full"
          >
            <RadarChart
              data={chartData}
              outerRadius={outerRadius}
              margin={{ top: 15, right: 20, bottom: 15, left: 20 }}
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
              <PolarRadiusAxis
                domain={[0, Math.max(...chartData.map((d) => d.activity), 1)]}
                tick={false}
                axisLine={false}
              />
              <PolarGrid />
              <Radar
                dataKey="activity"
                fill="var(--color-activity)"
                fillOpacity={0.6}
                stroke="var(--color-activity)"
                strokeWidth={2}
              />
            </RadarChart>
          </ChartContainer>
        ) : (
          <div className="text-center text-muted-foreground text-sm p-4">
            <p>No regions created yet.</p>
            <p className="text-xs mt-1 opacity-70">Create regions to see activity breakdown.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
