"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

interface TimeDistributionData {
  range: string
  count: number
  percentage: number
}

interface TimeDistributionChartProps {
  data: TimeDistributionData[]
  title: string
  description: string
  isLoading?: boolean
  unit: string
}

const chartConfig = {
  count: {
    label: "Cantidad",
    color: "hsl(var(--chart-1))",
  },
}

export function TimeDistributionChart({ data, title, description, isLoading, unit }: TimeDistributionChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="range"
                className="text-xs"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value} ${unit}`}
              />
              <YAxis className="text-xs" tick={{ fontSize: 12 }} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => `Rango: ${value} ${unit}`}
                    formatter={(value, name) => [`${value} registros`, name === "count" ? "Cantidad" : name]}
                  />
                }
              />
              <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Statistics Summary */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-lg">{data.reduce((sum, item) => sum + item.count, 0)}</div>
            <div className="text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg">
              {data.length > 0 ? Math.min(...data.map((d) => Number.parseInt(d.range.split("-")[0]))) : 0}
            </div>
            <div className="text-muted-foreground">Mínimo ({unit})</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg">
              {data.length > 0
                ? Math.max(...data.map((d) => Number.parseInt(d.range.split("-")[1] || d.range.split("-")[0])))
                : 0}
            </div>
            <div className="text-muted-foreground">Máximo ({unit})</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg">
              {data.length > 0
                ? Math.round(
                    data.reduce((sum, item, index) => {
                      const midpoint =
                        (Number.parseInt(item.range.split("-")[0]) +
                          Number.parseInt(item.range.split("-")[1] || item.range.split("-")[0])) /
                        2
                      return sum + midpoint * item.count
                    }, 0) / data.reduce((sum, item) => sum + item.count, 0),
                  )
                : 0}
            </div>
            <div className="text-muted-foreground">Promedio ({unit})</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
