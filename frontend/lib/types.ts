import { z } from "zod"

export const FiltrosSchema = z.object({
  from: z.string(),
  to: z.string(),
  interno: z.array(z.string()).optional(),
  servicio: z.array(z.string()).optional(),
  conductor: z.array(z.string()).optional(),
  tipo: z.array(z.string()).optional(),
  lugar: z.array(z.string()).optional(),
  page: z.number().optional().default(1),
  pageSize: z.number().optional().default(50),
  sortBy: z
    .enum(["fecha", "hora", "interno", "servicio", "tipo", "lugar", "conductor"])
    .optional()
    .default("fecha"),
  sortDir: z.enum(["asc", "desc"]).optional().default("desc"),
})

export type Filtros = z.infer<typeof FiltrosSchema>

export const RegistroSchema = z.object({
  id: z.number(),
  fecha: z.string(),
  hora: z.string().nullable(),
  interno: z.string().nullable(),
  tipo: z.string().nullable(),
  lugar: z.string().nullable(),
  conductor: z.string().nullable(),
  servicio: z.string().nullable(),
})

export type Registro = z.infer<typeof RegistroSchema>

export const TiempoViajeSchema = z.object({
  id: z.number(),
  fecha: z.string(),
  interno: z.string().nullable(),
  servicio: z.string().nullable(),
  minutosViaje: z.number(),
})

export type TiempoViaje = z.infer<typeof TiempoViajeSchema>

export const TiempoEsperaSchema = z.object({
  id: z.number(),
  fecha: z.string(),
  interno: z.string().nullable(),
  servicio: z.string().nullable(),
  minutosEspera: z.number(),
})

export type TiempoEspera = z.infer<typeof TiempoEsperaSchema>

export const KPIsSchema = z.object({
  viajesTotales: z.number(),
  tiempoViajePromedio: z.number(),
  tiempoEsperaPromedio: z.number(),
  serviciosActivos: z.number(),
})

export type KPIs = z.infer<typeof KPIsSchema>

export const RegistrosResponseSchema = z.object({
  rows: z.array(RegistroSchema),
  total: z.number(),
})

export type RegistrosResponse = z.infer<typeof RegistrosResponseSchema>

export interface ChartDataPoint {
  fecha: string
  minutosViaje: number
  minutosEspera: number
}

export const TopInternoSchema = z.object({
  interno: z.string(),
  viajes: z.number(),
})

export type TopInternoData = z.infer<typeof TopInternoSchema>

export interface FilterOptions {
  internos: string[]
  servicios: string[]
  conductores: string[]
  tipos: string[]
  lugares: string[]
}
