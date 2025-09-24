"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { GlobalFilters } from "@/components/global-filters"
import { DataTable, SortableHeader } from "@/components/data-table"
import { TimeDistributionChart } from "@/components/time-distribution-chart"
import { useFilters } from "@/lib/filter-context"
import type { Filtros, TiempoViaje, TiempoEspera } from "@/lib/types"

const travelColumns: ColumnDef<TiempoViaje>[] = [
  {
    accessorKey: "fecha",
    header: ({ column }) => <SortableHeader column={column}>Fecha</SortableHeader>,
    cell: ({ row }) => {
      const value = row.getValue("fecha") as string
      const date = value ? new Date(value) : undefined
      return <span className="font-mono text-sm">{date ? date.toLocaleDateString("es-ES") : "-"}</span>
    },
  },
  {
    accessorKey: "servicio",
    header: ({ column }) => <SortableHeader column={column}>Servicio</SortableHeader>,
    cell: ({ row }) => {
      const value = row.getValue("servicio") as string | null
      return value ? <Badge variant="secondary">{value}</Badge> : <span className="text-muted-foreground">-</span>
    },
  },
  {
    accessorKey: "interno",
    header: ({ column }) => <SortableHeader column={column}>Interno</SortableHeader>,
    cell: ({ row }) => {
      const value = row.getValue("interno") as string | null
      return value ? <Badge variant="outline">{value}</Badge> : <span className="text-muted-foreground">-</span>
    },
  },
  {
    accessorKey: "minutosViaje",
    header: ({ column }) => <SortableHeader column={column}>Minutos de Viaje</SortableHeader>,
    cell: ({ row }) => {
      const minutes = row.getValue("minutosViaje") as number
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm">{hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}</span>
          <Badge variant={minutes > 90 ? "destructive" : minutes > 60 ? "secondary" : "default"} className="text-xs">
            {minutes > 90 ? "Alto" : minutes > 60 ? "Medio" : "Normal"}
          </Badge>
        </div>
      )
    },
  },
]

const waitColumns: ColumnDef<TiempoEspera>[] = [
  {
    accessorKey: "fecha",
    header: ({ column }) => <SortableHeader column={column}>Fecha</SortableHeader>,
    cell: ({ row }) => {
      const value = row.getValue("fecha") as string
      const date = value ? new Date(value) : undefined
      return <span className="font-mono text-sm">{date ? date.toLocaleDateString("es-ES") : "-"}</span>
    },
  },
  {
    accessorKey: "servicio",
    header: ({ column }) => <SortableHeader column={column}>Servicio</SortableHeader>,
    cell: ({ row }) => {
      const value = row.getValue("servicio") as string | null
      return value ? <Badge variant="secondary">{value}</Badge> : <span className="text-muted-foreground">-</span>
    },
  },
  {
    accessorKey: "interno",
    header: ({ column }) => <SortableHeader column={column}>Interno</SortableHeader>,
    cell: ({ row }) => {
      const value = row.getValue("interno") as string | null
      return value ? <Badge variant="outline">{value}</Badge> : <span className="text-muted-foreground">-</span>
    },
  },
  {
    accessorKey: "minutosEspera",
    header: ({ column }) => <SortableHeader column={column}>Minutos de Espera</SortableHeader>,
    cell: ({ row }) => {
      const minutes = row.getValue("minutosEspera") as number
      return (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm">{minutes}m</span>
          <Badge variant={minutes > 20 ? "destructive" : minutes > 10 ? "secondary" : "default"} className="text-xs">
            {minutes > 20 ? "Alto" : minutes > 10 ? "Medio" : "Normal"}
          </Badge>
        </div>
      )
    },
  },
]

function generateDistribution(times: number[], binSize: number) {
  if (times.length === 0) return []

  const min = Math.min(...times)
  const max = Math.max(...times)
  const bins: Record<string, number> = {}

  for (let value = min; value <= max; value += binSize) {
    const rangeStart = value
    const rangeEnd = value + binSize - 1
    bins[`${rangeStart}-${rangeEnd}`] = 0
  }

  times.forEach((time) => {
    const binStart = Math.floor((time - min) / binSize) * binSize + min
    const key = `${binStart}-${binStart + binSize - 1}`
    if (bins[key] !== undefined) {
      bins[key] += 1
    }
  })

  const total = times.length
  return Object.entries(bins)
    .map(([range, count]) => ({
      range,
      count,
      percentage: (count / total) * 100,
    }))
    .filter((item) => item.count > 0)
}

function buildQueryParams(filters: Filtros): string {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return
    }

    if (Array.isArray(value)) {
      if (value.length > 0) {
        params.set(key, value.join(","))
      }
      return
    }

    if (key === "sortBy" || key === "sortDir") {
      return
    }

    if (key === "page" || key === "pageSize") {
      return
    }

    params.set(key, String(value))
  })

  return params.toString()
}

async function fetchTiemposViaje(filters: Filtros): Promise<TiempoViaje[]> {
  const response = await fetch(`/api/tiempos/viaje?${buildQueryParams(filters)}`)
  if (!response.ok) throw new Error("Failed to fetch travel times")
  return response.json()
}

async function fetchTiemposEspera(filters: Filtros): Promise<TiempoEspera[]> {
  const response = await fetch(`/api/tiempos/espera?${buildQueryParams(filters)}`)
  if (!response.ok) throw new Error("Failed to fetch wait times")
  return response.json()
}

export default function TiemposPage() {
  const { filters, setResultCount, setQueryTime } = useFilters()
  const [activeTab, setActiveTab] = useState("viaje")

  const {
    data: travelData,
    isLoading: travelLoading,
    error: travelError,
  } = useQuery({
    queryKey: ["tiempos-viaje", filters],
    queryFn: () => fetchTiemposViaje(filters),
    staleTime: 5 * 60 * 1000,
  })

  const {
    data: waitData,
    isLoading: waitLoading,
    error: waitError,
  } = useQuery({
    queryKey: ["tiempos-espera", filters],
    queryFn: () => fetchTiemposEspera(filters),
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    const totalRecords = (travelData?.length ?? 0) + (waitData?.length ?? 0)
    if (totalRecords > 0) {
      setResultCount(totalRecords)
      setQueryTime(Math.floor(Math.random() * 300) + 100)
    }
  }, [travelData, waitData, setResultCount, setQueryTime])

  const travelDistribution = travelData ? generateDistribution(travelData.map((t) => t.minutosViaje), 15) : []
  const waitDistribution = waitData ? generateDistribution(waitData.map((t) => t.minutosEspera), 5) : []

  const handleTravelExport = () => {
  // Removed unnecessary characters

    if (!travelData) return;
    const headers = ["Fecha", "Servicio", "Interno", "Minutos de Viaje"];
    const csvContent = [
      headers.join(","),
      ...(travelData ? travelData.map((record) =>
        [
          record.fecha,
          record.servicio ?? "",
          record.interno ?? "",
          record.minutosViaje,
        ]
          .map((field) => `"${String(field ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ) : [])
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `tiempos_viaje_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Removed unnecessary characters
  const handleWaitExport = () => {
    if (!waitData) return;
    const headers = ["Fecha", "Servicio", "Interno", "Minutos de Espera"];
    const csvContent = [
      headers.join(","),
      ...(waitData ? waitData.map((record) =>
        [record.fecha, record.servicio ?? "", record.interno ?? "", record.minutosEspera]
          .map((field) => `"${String(field ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ) : [])
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `tiempos_espera_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (travelError || waitError) {
    return (
      <div className="space-y-6">
        <GlobalFilters />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-destructive">Error al cargar los datos de tiempos</h3>
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
          <h1 className="text-3xl font-bold tracking-tight">Analisis de Tiempos</h1>
          <p className="text-muted-foreground">Analisis detallado de tiempos de viaje y espera con distribuciones y metricas</p>
        </div>
      </div>

      <GlobalFilters />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="viaje">Tiempos de Viaje</TabsTrigger>
          <TabsTrigger value="espera">Tiempos de Espera</TabsTrigger>
        </TabsList>

        <TabsContent value="viaje" className="space-y-6">
          <TimeDistributionChart
            data={travelDistribution}
            title="Distribucion de Tiempos de Viaje"
            description="Histograma que muestra la distribucion de duracion de viajes en intervalos de 15 minutos"
            isLoading={travelLoading}
            unit="min"
          />

          <DataTable
            columns={travelColumns}
            data={travelData || []}
            isLoading={travelLoading}
            onExport={handleTravelExport}
            searchPlaceholder="Buscar tiempos de viaje..."
            title="Tabla de Tiempos de Viaje"
            description="Registro detallado de los tiempos de viaje en el periodo seleccionado"
          />
        </TabsContent>

        <TabsContent value="espera" className="space-y-6">
          <TimeDistributionChart
            data={waitDistribution}
            title="Distribucion de Tiempos de Espera"
            description="Histograma que muestra la distribucion de tiempos de espera en intervalos de 5 minutos"
            isLoading={waitLoading}
            unit="min"
          />

          <DataTable
            columns={waitColumns}
            data={waitData || []}
            isLoading={waitLoading}
            onExport={handleWaitExport}
            searchPlaceholder="Buscar tiempos de espera..."
            title="Tabla de Tiempos de Espera"
            description="Registro detallado de los tiempos de espera en el periodo seleccionado"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
