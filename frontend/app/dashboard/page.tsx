"use client"

import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { GlobalFilters } from "@/components/global-filters"
import { KPICards } from "@/components/kpi-cards"
import { DashboardCharts } from "@/components/dashboard-charts"
import { useFilters } from "@/lib/filter-context"
import type { KPIs, ChartDataPoint, TopInternoData } from "@/lib/types"

async function fetchKPIs(filters: any): Promise<KPIs> {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        params.set(key, value.join(","))
      } else {
        params.set(key, String(value))
      }
    }
  })

  const response = await fetch(`/api/kpis?${params}`)
  if (!response.ok) throw new Error("Failed to fetch KPIs")
  return response.json()
}

async function fetchChartData(filters: any): Promise<ChartDataPoint[]> {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        params.set(key, value.join(","))
      } else {
        params.set(key, String(value))
      }
    }
  })

  const response = await fetch(`/api/chart-data?${params}`)
  if (!response.ok) throw new Error("Failed to fetch chart data")
  return response.json()
}

async function fetchTopInternos(filters: any): Promise<TopInternoData[]> {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        params.set(key, value.join(","))
      } else {
        params.set(key, String(value))
      }
    }
  })

  const response = await fetch(`/api/top-internos?${params}`)
  if (!response.ok) throw new Error("Failed to fetch top internos")
  return response.json()
}

export default function DashboardPage() {
  const { filters, setResultCount, setQueryTime } = useFilters()

  // Fetch KPIs
  const {
    data: kpisData,
    isLoading: kpisLoading,
    error: kpisError,
  } = useQuery({
    queryKey: ["kpis", filters],
    queryFn: () => fetchKPIs(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch Chart Data
  const {
    data: chartData,
    isLoading: chartLoading,
    error: chartError,
  } = useQuery({
    queryKey: ["chart-data", filters],
    queryFn: () => fetchChartData(filters),
    staleTime: 5 * 60 * 1000,
  })

  // Fetch Top Internos
  const {
    data: topInternosData,
    isLoading: topInternosLoading,
    error: topInternosError,
  } = useQuery({
    queryKey: ["top-internos", filters],
    queryFn: () => fetchTopInternos(filters),
    staleTime: 5 * 60 * 1000,
  })

  // Update result count and query time when data loads
  useEffect(() => {
    if (kpisData) {
      setResultCount(kpisData.viajesTotales)
      setQueryTime(Math.floor(Math.random() * 200) + 50) // Mock query time
    }
  }, [kpisData, setResultCount, setQueryTime])

  const isLoading = kpisLoading || chartLoading || topInternosLoading
  const hasError = kpisError || chartError || topInternosError

  if (hasError) {
    return (
      <div className="space-y-6">
        <GlobalFilters />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-destructive">Error al cargar los datos</h3>
            <p className="text-muted-foreground">Por favor, intenta nuevamente o verifica los filtros seleccionados.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Operativo</h1>
          <p className="text-muted-foreground">Visualización de métricas y KPIs de control de horarios y operación</p>
        </div>
      </div>

      <GlobalFilters />

      <KPICards
        data={
          kpisData || {
            viajesTotales: 0,
            tiempoViajePromedio: 0,
            tiempoEsperaPromedio: 0,
            serviciosActivos: 0,
          }
        }
        isLoading={kpisLoading}
      />

      <DashboardCharts
        timeSeriesData={chartData || []}
        topInternosData={topInternosData || []}
        isLoading={chartLoading || topInternosLoading}
      />
    </div>
  )
}
