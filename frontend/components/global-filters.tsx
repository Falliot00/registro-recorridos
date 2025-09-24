"use client"

import { useMemo, useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { CalendarIcon, Filter, X, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useFilters } from "@/lib/filter-context"
import type { FilterOptions } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface MultiSelectProps {
  options: { value: string; label: string }[]
  selected: string[]
  onSelectionChange: (selected: string[]) => void
  placeholder: string
  searchPlaceholder: string
  isLoading?: boolean
}

async function fetchFilterOptions(): Promise<FilterOptions> {
  const response = await fetch("/api/filters", { cache: "no-cache" })
  if (!response.ok) {
    throw new Error("No se pudieron obtener las opciones de filtro")
  }
  return response.json()
}

function MultiSelect({ options, selected, onSelectionChange, placeholder, searchPlaceholder, isLoading }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filteredOptions = options.filter((option) => option.label.toLowerCase().includes(search.toLowerCase()))

  const toggleOption = (value: string) => {
    if (isLoading) return
    const exists = selected.includes(value)
    const next = exists ? selected.filter((item) => item !== value) : [...selected, value]
    onSelectionChange(next)
  }

  const removeOption = (value: string) => {
    if (isLoading) return
    onSelectionChange(selected.filter((item) => item !== value))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-10 px-3 py-2 bg-transparent"
          /*disabled={isLoading}*/
        >
          <div className="flex flex-wrap gap-1">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{isLoading ? "Cargando..." : placeholder}</span>
            ) : (
              selected.slice(0, 3).map((value) => {
                const option = options.find((opt) => opt.value === value)
                return (
                  <Badge key={value} variant="secondary" className="text-xs">
                    {option?.label ?? value}
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={`Quitar ${option?.label ?? value}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        removeOption(value)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          event.stopPropagation()
                          removeOption(value)
                        }
                      }}
                      className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-secondary-foreground/20 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                )
              })
            )}
            {selected.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{selected.length - 3} m?s
              </Badge>
            )}
          </div>
          <Filter className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="max-h-60 overflow-auto p-1">
          {filteredOptions.length === 0 ? (
            <div className="px-2 py-4 text-sm text-muted-foreground">
              {isLoading ? "Cargando opciones..." : "Sin coincidencias"}
            </div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                className={cn(
                  "flex items-center space-x-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent",
                  selected.includes(option.value) && "bg-accent",
                )}
                onClick={() => toggleOption(option.value)}
              >
                <span>{option.label}</span>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function GlobalFilters() {
  const { filters, updateFilters, resetFilters, resultCount, queryTime } = useFilters()

  useEffect(() => {
    setDateRange({
      from: new Date(filters.from),
      to: new Date(filters.to),
    })
  }, [filters.from, filters.to])

  const { data: filterOptions, isLoading: loadingOptions } = useQuery({
    queryKey: ["filter-options"],
    queryFn: fetchFilterOptions,
    staleTime: 5 * 60 * 1000,
  })

  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => ({
    from: new Date(filters.from),
    to: new Date(filters.to),
  }))

  const internoOptions = useMemo(() => {
    return (filterOptions?.internos ?? []).map((value) => ({ value, label: value }))
  }, [filterOptions])

  const servicioOptions = useMemo(() => {
    return (filterOptions?.servicios ?? []).map((value) => ({ value, label: value }))
  }, [filterOptions])

  const conductorOptions = useMemo(() => {
    return (filterOptions?.conductores ?? []).map((value) => ({ value, label: value }))
  }, [filterOptions])

  const tipoOptions = useMemo(() => {
    return (filterOptions?.tipos ?? []).map((value) => ({ value, label: value }))
  }, [filterOptions])

  const lugarOptions = useMemo(() => {
    return (filterOptions?.lugares ?? []).map((value) => ({ value, label: value }))
  }, [filterOptions])

  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    setDateRange(range)
    updateFilters({
      from: range.from.toISOString().slice(0, 10),
      to: range.to.toISOString().slice(0, 10),
    })
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Filtros</h3>
          <p className="text-sm text-muted-foreground">Refina la informaci?n mostrada en cada secci?n</p>
        </div>
        <Button variant="outline" onClick={resetFilters} className="bg-transparent">
          Limpiar filtros
        </Button>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Rango de Fechas <span className="text-destructive">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd MMM yyyy", { locale: es })} -{" "}
                      {format(dateRange.to, "dd MMM yyyy", { locale: es })}
                    </>
                  ) : (
                    format(dateRange.from, "dd MMM yyyy", { locale: es })
                  )
                ) : (
                  <span>Seleccionar rango de fechas</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    handleDateRangeChange({ from: range.from, to: range.to })
                  }
                }}
                numberOfMonths={2}
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Interno</Label>
            <MultiSelect
              options={internoOptions}
              selected={filters.interno ?? []}
              onSelectionChange={(selected) => updateFilters({ interno: selected })}
              placeholder="Seleccionar internos"
              searchPlaceholder="Buscar interno..."
              isLoading={loadingOptions}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Servicio</Label>
            <MultiSelect
              options={servicioOptions}
              selected={filters.servicio ?? []}
              onSelectionChange={(selected) => updateFilters({ servicio: selected })}
              placeholder="Seleccionar servicios"
              searchPlaceholder="Buscar servicio..."
              isLoading={loadingOptions}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Conductor</Label>
            <MultiSelect
              options={conductorOptions}
              selected={filters.conductor ?? []}
              onSelectionChange={(selected) => updateFilters({ conductor: selected })}
              placeholder="Seleccionar conductores"
              searchPlaceholder="Buscar conductor..."
              isLoading={loadingOptions}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipo</Label>
            <MultiSelect
              options={tipoOptions}
              selected={filters.tipo ?? []}
              onSelectionChange={(selected) => updateFilters({ tipo: selected })}
              placeholder="Seleccionar tipos"
              searchPlaceholder="Buscar tipo..."
              isLoading={loadingOptions}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Lugar</Label>
            <MultiSelect
              options={lugarOptions}
              selected={filters.lugar ?? []}
              onSelectionChange={(selected) => updateFilters({ lugar: selected })}
              placeholder="Seleccionar lugares"
              searchPlaceholder="Buscar lugar..."
              isLoading={loadingOptions}
            />
          </div>
        </div>

        {(resultCount > 0 || queryTime > 0) && (
          <>
            <Separator />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{resultCount.toLocaleString()} resultados encontrados</span>
              {queryTime > 0 && <span>Consulta ejecutada en {queryTime} ms</span>}
            </div>
          </>
        )}
      </div>
    </Card>
  )
}


