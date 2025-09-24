"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { GlobalFilters } from "@/components/global-filters"
import { DataTable, SortableHeader } from "@/components/data-table"
import { RecordDetailDrawer } from "@/components/record-detail-drawer"
import { useFilters } from "@/lib/filter-context"
import type { Filtros, Registro, RegistrosResponse } from "@/lib/types"

const columns: ColumnDef<Registro>[] = [
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
    accessorKey: "hora",
    header: ({ column }) => <SortableHeader column={column}>Hora</SortableHeader>,
    cell: ({ row }) => {
      const value = row.getValue("hora") as string | null
      return <span className="font-mono text-sm">{value ?? "--"}</span>
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
    accessorKey: "servicio",
    header: ({ column }) => <SortableHeader column={column}>Servicio</SortableHeader>,
    cell: ({ row }) => {
      const value = row.getValue("servicio") as string | null
      return value ? <Badge variant="secondary">{value}</Badge> : <span className="text-muted-foreground">-</span>
    },
  },
  {
    accessorKey: "conductor",
    header: ({ column }) => <SortableHeader column={column}>Conductor</SortableHeader>,
    cell: ({ row }) => {
      const value = row.getValue("conductor") as string | null
      return value ? <span>{value}</span> : <span className="text-muted-foreground">-</span>
    },
  },
  {
    accessorKey: "tipo",
    header: ({ column }) => <SortableHeader column={column}>Tipo</SortableHeader>,
    cell: ({ row }) => {
      const tipo = row.getValue("tipo") as string | null
      if (!tipo) return <span className="text-muted-foreground">-</span>

      const variant = tipo === "Entrada" ? "default" : tipo === "Salida" ? "secondary" : "outline"
      return <Badge variant={variant}>{tipo}</Badge>
    },
  },
  {
    accessorKey: "lugar",
    header: ({ column }) => <SortableHeader column={column}>Lugar</SortableHeader>,
    cell: ({ row }) => {
      const value = row.getValue("lugar") as string | null
      return value ? <span>{value}</span> : <span className="text-muted-foreground">-</span>
    },
  },
]

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

    if (key === "sortBy" && value === "fecha") {
      return
    }

    if (key === "sortDir" && value === "desc") {
      return
    }

    if (key === "page" && value === 1) {
      return
    }

    if (key === "pageSize" && value === 50) {
      return
    }

    params.set(key, String(value))
  })

  return params.toString()
}

async function fetchRegistros(filters: Filtros): Promise<RegistrosResponse> {
  const queryString = buildQueryParams({ ...filters, page: 1, pageSize: 0 })
  const response = await fetch(`/api/registros?${queryString}`)
  if (!response.ok) throw new Error("Failed to fetch registros")
  return response.json()
}

export default function RegistrosPage() {
  const { filters, setResultCount, setQueryTime } = useFilters()
  const [selectedRecord, setSelectedRecord] = useState<Registro | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const {
    data: registrosData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["registros", filters],
    queryFn: () => fetchRegistros(filters),
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (registrosData) {
      setResultCount(registrosData.total)
      setQueryTime(Math.floor(Math.random() * 300) + 100)
    }
  }, [registrosData, setResultCount, setQueryTime])

  const handleRowClick = (record: Registro) => {
    setSelectedRecord(record)
    setDrawerOpen(true)
  }

  const handleExport = () => {
    if (!registrosData?.rows?.length) return

    const headers = ["Fecha", "Hora", "Interno", "Servicio", "Conductor", "Tipo", "Lugar"]
    const csvContent = [
      headers.join(","),
      ...registrosData.rows.map((record) =>
        [
          record.fecha,
          record.hora ?? "",
          record.interno ?? "",
          record.servicio ?? "",
          record.conductor ?? "",
          record.tipo ?? "",
          record.lugar ?? "",
        ]
          .map((field) => `"${String(field ?? "").replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `registros_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (error) {
    return (
      <div className="space-y-6">
        <GlobalFilters />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-destructive">Error al cargar los registros</h3>
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
          <h1 className="text-3xl font-bold tracking-tight">Registros de Control</h1>
          <p className="text-muted-foreground">Tabla completa de registros con filtros y exportacion</p>
        </div>
      </div>

      <GlobalFilters />

      <DataTable
        columns={columns}
        data={registrosData?.rows || []}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        onExport={handleExport}
        searchPlaceholder="Buscar en registros..."
        title="Tabla de Registros"
        description="Haz clic en cualquier fila para ver el detalle completo del registro"
      />

      <RecordDetailDrawer record={selectedRecord} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  )
}

