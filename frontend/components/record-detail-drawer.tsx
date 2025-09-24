"use client"

import { Clock, User, Route, Building } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { Registro } from "@/lib/types"

interface RecordDetailDrawerProps {
  record: Registro | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RecordDetailDrawer({ record, open, onOpenChange }: RecordDetailDrawerProps) {
  if (!record) return null

  const displayDate = () => {
    try {
      return new Date(record.fecha).toLocaleDateString("es-ES")
    } catch (error) {
      return record.fecha
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[520px]">
        <SheetHeader>
          <SheetTitle>Detalle del Registro</SheetTitle>
          <SheetDescription>Informaci?n completa del evento registrado</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Fecha y Hora</span>
            </div>
            <div className="pl-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha:</span>
                <span className="font-medium">{displayDate()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hora:</span>
                <span className="font-medium">{record.hora ?? "--"}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Route className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Servicio</span>
            </div>
            <div className="pl-6 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Interno:</span>
                {record.interno ? <Badge variant="outline">{record.interno}</Badge> : <span className="text-muted-foreground">-</span>}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Servicio:</span>
                {record.servicio ? <Badge variant="secondary">{record.servicio}</Badge> : <span className="text-muted-foreground">-</span>}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Conductor:</span>
                <span className="font-medium">{record.conductor ?? "-"}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Ubicaci?n</span>
            </div>
            <div className="pl-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lugar:</span>
                <span className="font-medium text-right max-w-48">{record.lugar ?? "-"}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Informaci?n Adicional</span>
            </div>
            <div className="pl-6 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tipo:</span>
                {record.tipo ? <Badge variant={record.tipo === "Entrada" ? "default" : "secondary"}>{record.tipo}</Badge> : <span className="text-muted-foreground">-</span>}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
