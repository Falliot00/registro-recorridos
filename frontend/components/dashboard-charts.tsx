"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts"
import type { ChartDataPoint, TopInternoData } from "@/lib/types"

interface DashboardChartsProps {
  timeSeriesData: ChartDataPoint[]
  topInternosData: TopInternoData[]
  isLoading?: boolean
}

const chartConfig = {
  minutosViaje: {
    label: "Tiempo de Viaje",
    color: "hsl(var(--chart-1))",
  },
  minutosEspera: {
    label: "Tiempo de Espera",
    color: "hsl(var(--chart-2))",
  },
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    </div>
  )
}

export function DashboardCharts({ timeSeriesData, topInternosData, isLoading }: DashboardChartsProps) {
  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Time Series Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Tendencia de Tiempos Operativos</CardTitle>
          <CardDescription>Promedio diario de tiempos de viaje y espera en los ultimos 30 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-80">
            <AreaChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorViaje" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorEspera" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="fecha"
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return `${date.getDate()}/${date.getMonth() + 1}`
                }}
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      const date = new Date(value)
                      return date.toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    }}
                    formatter={(value, name) => [
                      `${value} min`,
                      name === "minutosViaje" ? "Tiempo de Viaje" : "Tiempo de Espera",
                    ]}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="minutosViaje"
                stroke="hsl(var(--chart-1))"
                fillOpacity={1}
                fill="url(#colorViaje)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="minutosEspera"
                stroke="hsl(var(--chart-2))"
                fillOpacity={1}
                fill="url(#colorEspera)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Top Internos Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Internos por Cantidad de Viajes</CardTitle>
          <CardDescription>Ranking de vehiculos con mayor actividad en el periodo seleccionado</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              viajes: {
                label: "Viajes",
                color: "hsl(var(--chart-3))",
              },
            }}
            className="h-80"
          >
            <BarChart data={topInternosData} layout="horizontal" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" />
              <YAxis
                dataKey="interno"
                type="category"
                tickFormatter={(value) => value as string}
                className="text-xs"
                width={120}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => value as string}
                    formatter={(value) => [`${value} viajes`, "Total"]}
                  />
                }
              />
              <Bar dataKey="viajes" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
