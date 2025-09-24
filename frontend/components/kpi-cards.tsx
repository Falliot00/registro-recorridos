"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Clock, Route, Users, Activity } from "lucide-react"
import type { KPIs } from "@/lib/types"

interface KPICardsProps {
  data: KPIs
  isLoading?: boolean
}

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  isLoading?: boolean
}

function KPICard({ title, value, subtitle, icon, trend, isLoading }: KPICardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="h-4 w-4 text-muted-foreground">{icon}</div>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          {subtitle && <div className="h-4 w-16 bg-muted animate-pulse rounded mt-2" />}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">{typeof value === "number" ? value.toLocaleString() : value}</div>
          {trend && (
            <Badge variant={trend.isPositive ? "default" : "secondary"} className="text-xs">
              {trend.isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {Math.abs(trend.value)}%
            </Badge>
          )}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}

export function KPICards({ data, isLoading }: KPICardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Viajes Totales"
        value={data.viajesTotales}
        subtitle="En el período seleccionado"
        icon={<Route className="h-4 w-4" />}
        trend={{ value: 12, isPositive: true }}
        isLoading={isLoading}
      />
      <KPICard
        title="Tiempo Promedio de Viaje"
        value={`${data.tiempoViajePromedio} min`}
        subtitle="Promedio por viaje"
        icon={<Clock className="h-4 w-4" />}
        trend={{ value: 5, isPositive: false }}
        isLoading={isLoading}
      />
      <KPICard
        title="Tiempo Promedio de Espera"
        value={`${data.tiempoEsperaPromedio} min`}
        subtitle="Promedio por parada"
        icon={<Activity className="h-4 w-4" />}
        trend={{ value: 8, isPositive: true }}
        isLoading={isLoading}
      />
      <KPICard
        title="Servicios Activos"
        value={data.serviciosActivos}
        subtitle="Servicios únicos"
        icon={<Users className="h-4 w-4" />}
        isLoading={isLoading}
      />
    </div>
  )
}
