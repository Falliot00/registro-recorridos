import { createRequest, sql, type SqlParameter } from "./db"
import type {
  ChartDataPoint,
  Filtros,
  KPIs,
  Registro,
  RegistrosResponse,
  TiempoEspera,
  TiempoViaje,
  TopInternoData,
} from "./types"

const TABLE_NAME = "pointer.ControlHorarios"

const SORTABLE_COLUMNS: Record<string, string> = {
  fecha: "[Fecha]",
  hora: "[Hora]",
  interno: "[Interno]",
  servicio: "[Servicio]",
  tipo: "[Tipo]",
  lugar: "[Lugar]",
  conductor: "[Conductor]",
}

function sanitizeString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null
  }

  const trimmed = String(value).trim()
  return trimmed.length ? trimmed : null
}

function formatDateOnly(value: unknown): string {
  if (!value) {
    return ""
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }

  const date = new Date(value as string)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }
  return date.toISOString().slice(0, 10)
}

function formatTimeOnly(value: unknown): string | null {
  if (!value) {
    return null
  }

  if (value instanceof Date) {
    return value.toISOString().slice(11, 19)
  }

  if (typeof value === "string") {
    return value.slice(0, 8)
  }

  return null
}

function toRegistro(row: any): Registro {
  return {
    id: Number(row.Id),
    fecha: formatDateOnly(row.Fecha),
    hora: formatTimeOnly(row.Hora),
    interno: sanitizeString(row.Interno),
    tipo: sanitizeString(row.Tipo),
    lugar: sanitizeString(row.Lugar),
    conductor: sanitizeString(row.Conductor),
    servicio: sanitizeString(row.Servicio),
  }
}

function toTiempoViaje(row: any): TiempoViaje {
  return {
    id: Number(row.Id),
    fecha: formatDateOnly(row.Fecha),
    interno: sanitizeString(row.Interno),
    servicio: sanitizeString(row.Servicio),
    minutosViaje: row.Minutos ?? 0,
  }
}

function toTiempoEspera(row: any): TiempoEspera {
  return {
    id: Number(row.Id),
    fecha: formatDateOnly(row.Fecha),
    interno: sanitizeString(row.Interno),
    servicio: sanitizeString(row.Servicio),
    minutosEspera: row.Minutos ?? 0,
  }
}

export class DatabaseMapper {
  static buildWhereClause(filters: Filtros): { clause: string; params: SqlParameter[] } {
    const conditions: string[] = []
    const params: SqlParameter[] = []

    const addParam = (name: string, type: sql.ISqlTypeFactory, value: unknown) => {
      params.push({ name, type, value })
    }

    if (filters.from) {
      conditions.push("[Fecha] >= @from")
      addParam("from", sql.Date, filters.from)
    }

    if (filters.to) {
      conditions.push("[Fecha] <= @to")
      addParam("to", sql.Date, filters.to)
    }

    const addListCondition = (values: string[] | undefined, column: string, prefix: string) => {
      if (!values || values.length === 0) {
        return
      }

      const cleaned = values.map((value) => sanitizeString(value)).filter((value): value is string => Boolean(value))
      if (!cleaned.length) {
        return
      }

      const placeholders: string[] = []
      cleaned.forEach((value, index) => {
        const paramName = `${prefix}${index}`
        placeholders.push(`@${paramName}`)
        addParam(paramName, sql.NVarChar, value)
      })

      conditions.push(`${column} IN (${placeholders.join(",")})`)
    }

    addListCondition(filters.interno, "[Interno]", "interno")
    addListCondition(filters.servicio, "[Servicio]", "servicio")
    addListCondition(filters.conductor, "[Conductor]", "conductor")
    addListCondition(filters.tipo, "[Tipo]", "tipo")
    addListCondition(filters.lugar, "[Lugar]", "lugar")

    return {
      clause: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
      params,
    }
  }

  static getSortColumn(sortBy?: string): string {
    if (!sortBy) {
      return SORTABLE_COLUMNS.fecha
    }

    const key = sortBy.toLowerCase()
    return SORTABLE_COLUMNS[key] ?? SORTABLE_COLUMNS.fecha
  }

  static getSortDirection(sortDir?: string): "ASC" | "DESC" {
    return sortDir && sortDir.toLowerCase() === "asc" ? "ASC" : "DESC"
  }

  static async getKPIs(filters: Filtros): Promise<KPIs> {
    const { clause, params } = this.buildWhereClause(filters)

    const request = await createRequest(params)
    const query = `
      WITH Filtered AS (
        SELECT
          Id,
          Fecha,
          Hora,
          Interno,
          Tipo,
          Lugar,
          Conductor,
          Servicio,
          DATEADD(SECOND, DATEDIFF(SECOND, 0, Hora), CAST(Fecha AS datetime2)) AS DateTimeValue
        FROM ${TABLE_NAME}
        ${clause}
      ),
      Ordered AS (
        SELECT
          *,
          LAG(DateTimeValue) OVER (PARTITION BY Interno ORDER BY DateTimeValue) AS PrevDateTime,
          LAG(Tipo) OVER (PARTITION BY Interno ORDER BY DateTimeValue) AS PrevTipo
        FROM Filtered
      ),
      Diffs AS (
        SELECT
          *,
          DATEDIFF(MINUTE, PrevDateTime, DateTimeValue) AS MinutesSincePrev
        FROM Ordered
        WHERE PrevDateTime IS NOT NULL
      )
      SELECT
        (SELECT COUNT(1) FROM Filtered) AS viajesTotales,
        COALESCE((SELECT AVG(CAST(MinutesSincePrev AS float)) FROM Diffs WHERE PrevTipo = 'Salida'), 0) AS tiempoViajePromedio,
        COALESCE((SELECT AVG(CAST(MinutesSincePrev AS float)) FROM Diffs WHERE PrevTipo <> 'Salida'), 0) AS tiempoEsperaPromedio,
        COALESCE((SELECT COUNT(DISTINCT Servicio) FROM Filtered WHERE Servicio IS NOT NULL AND Servicio <> ''), 0) AS serviciosActivos
    `

    const result = await request.query(query)
    const row = result.recordset[0]

    return {
      viajesTotales: row ? Number(row.viajesTotales) || 0 : 0,
      tiempoViajePromedio: row ? Math.round(Number(row.tiempoViajePromedio) || 0) : 0,
      tiempoEsperaPromedio: row ? Math.round(Number(row.tiempoEsperaPromedio) || 0) : 0,
      serviciosActivos: row ? Number(row.serviciosActivos) || 0 : 0,
    }
  }

  static async getChartData(filters: Filtros): Promise<ChartDataPoint[]> {
    const { clause, params } = this.buildWhereClause(filters)

    const request = await createRequest(params)
    const query = `
      WITH Filtered AS (
        SELECT
          Id,
          Fecha,
          Hora,
          Interno,
          Tipo,
          DATEADD(SECOND, DATEDIFF(SECOND, 0, Hora), CAST(Fecha AS datetime2)) AS DateTimeValue
        FROM ${TABLE_NAME}
        ${clause}
      ),
      Ordered AS (
        SELECT
          *,
          LAG(DateTimeValue) OVER (PARTITION BY Interno ORDER BY DateTimeValue) AS PrevDateTime,
          LAG(Tipo) OVER (PARTITION BY Interno ORDER BY DateTimeValue) AS PrevTipo
        FROM Filtered
      )
      SELECT TOP (90)
        CONVERT(char(10), DateTimeValue, 23) AS Fecha,
        COALESCE(AVG(CASE WHEN PrevTipo = 'Salida' THEN DATEDIFF(MINUTE, PrevDateTime, DateTimeValue) END), 0) AS MinutosViaje,
        COALESCE(AVG(CASE WHEN PrevTipo <> 'Salida' THEN DATEDIFF(MINUTE, PrevDateTime, DateTimeValue) END), 0) AS MinutosEspera
      FROM Ordered
      WHERE PrevDateTime IS NOT NULL
      GROUP BY CONVERT(char(10), DateTimeValue, 23)
      ORDER BY Fecha
    `

    const result = await request.query(query)

    return result.recordset.map((row) => ({
      fecha: row.Fecha,
      minutosViaje: Math.round(Number(row.MinutosViaje) || 0),
      minutosEspera: Math.round(Number(row.MinutosEspera) || 0),
    }))
  }

  static async getTopInternos(filters: Filtros): Promise<TopInternoData[]> {
    const { clause, params } = this.buildWhereClause(filters)
    const request = await createRequest(params)

    const query = `
      SELECT TOP (10)
        Interno,
        COUNT(1) AS Viajes
      FROM ${TABLE_NAME}
      ${clause}
      GROUP BY Interno
      HAVING Interno IS NOT NULL AND Interno <> ''
      ORDER BY Viajes DESC
    `

    const result = await request.query(query)

    return result.recordset.map((row) => ({
      interno: sanitizeString(row.Interno) ?? "Sin asignar",
      viajes: Number(row.Viajes) || 0,
    }))
  }

  static async getRegistros(filters: Filtros): Promise<RegistrosResponse> {
    const pageSize = filters.pageSize ?? 50
    const page = filters.page ?? 1
    const offset = (page - 1) * pageSize

    const { clause, params } = this.buildWhereClause(filters)
    const sortColumn = this.getSortColumn(filters.sortBy)
    const sortDirection = this.getSortDirection(filters.sortDir)

    const request = await createRequest([
      ...params,
      { name: "offset", type: sql.Int, value: offset },
      { name: "pageSize", type: sql.Int, value: pageSize },
    ])

    const dataQuery = `
      SELECT
        Id,
        Fecha,
        Hora,
        Interno,
        Tipo,
        Lugar,
        Conductor,
        Servicio
      FROM ${TABLE_NAME}
      ${clause}
      ORDER BY ${sortColumn} ${sortDirection}, Id ${sortDirection}
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `

    const dataResult = await request.query(dataQuery)
    const rows = dataResult.recordset.map(toRegistro)

    const countRequest = await createRequest(params)
    const countResult = await countRequest.query(`
      SELECT COUNT(1) AS total
      FROM ${TABLE_NAME}
      ${clause}
    `)

    const total = Number(countResult.recordset[0]?.total) || 0

    return { rows, total }
  }

  static async getTiemposViaje(filters: Filtros): Promise<TiempoViaje[]> {
    const { clause, params } = this.buildWhereClause(filters)
    const request = await createRequest(params)

    const query = `
      WITH Filtered AS (
        SELECT
          Id,
          Fecha,
          Hora,
          Interno,
          Tipo,
          Servicio,
          DATEADD(SECOND, DATEDIFF(SECOND, 0, Hora), CAST(Fecha AS datetime2)) AS DateTimeValue
        FROM ${TABLE_NAME}
        ${clause}
      ),
      Ordered AS (
        SELECT
          *,
          LAG(DateTimeValue) OVER (PARTITION BY Interno ORDER BY DateTimeValue) AS PrevDateTime,
          LAG(Tipo) OVER (PARTITION BY Interno ORDER BY DateTimeValue) AS PrevTipo
        FROM Filtered
      )
      SELECT
        Id,
        Fecha,
        Interno,
        Servicio,
        DATEDIFF(MINUTE, PrevDateTime, DateTimeValue) AS Minutos
      FROM Ordered
      WHERE PrevDateTime IS NOT NULL AND PrevTipo = 'Salida'
      ORDER BY DateTimeValue DESC
    `

    const result = await request.query(query)
    return result.recordset.map(toTiempoViaje)
  }

  static async getTiemposEspera(filters: Filtros): Promise<TiempoEspera[]> {
    const { clause, params } = this.buildWhereClause(filters)
    const request = await createRequest(params)

    const query = `
      WITH Filtered AS (
        SELECT
          Id,
          Fecha,
          Hora,
          Interno,
          Tipo,
          Servicio,
          DATEADD(SECOND, DATEDIFF(SECOND, 0, Hora), CAST(Fecha AS datetime2)) AS DateTimeValue
        FROM ${TABLE_NAME}
        ${clause}
      ),
      Ordered AS (
        SELECT
          *,
          LAG(DateTimeValue) OVER (PARTITION BY Interno ORDER BY DateTimeValue) AS PrevDateTime,
          LAG(Tipo) OVER (PARTITION BY Interno ORDER BY DateTimeValue) AS PrevTipo
        FROM Filtered
      )
      SELECT
        Id,
        Fecha,
        Interno,
        Servicio,
        DATEDIFF(MINUTE, PrevDateTime, DateTimeValue) AS Minutos
      FROM Ordered
      WHERE PrevDateTime IS NOT NULL AND (PrevTipo <> 'Salida' OR PrevTipo IS NULL)
      ORDER BY DateTimeValue DESC
    `

    const result = await request.query(query)
    return result.recordset.map(toTiempoEspera)
  }

  static async getFilterOptions() {
    const request = await createRequest()
    const result = await request.query(`
      SELECT DISTINCT Interno FROM ${TABLE_NAME} WHERE Interno IS NOT NULL AND Interno <> '' ORDER BY Interno;
      SELECT DISTINCT Servicio FROM ${TABLE_NAME} WHERE Servicio IS NOT NULL AND Servicio <> '' ORDER BY Servicio;
      SELECT DISTINCT Conductor FROM ${TABLE_NAME} WHERE Conductor IS NOT NULL AND Conductor <> '' ORDER BY Conductor;
      SELECT DISTINCT Tipo FROM ${TABLE_NAME} WHERE Tipo IS NOT NULL AND Tipo <> '' ORDER BY Tipo;
      SELECT DISTINCT Lugar FROM ${TABLE_NAME} WHERE Lugar IS NOT NULL AND Lugar <> '' ORDER BY Lugar;
    `)

    const [internos, servicios, conductores, tipos, lugares] = result.recordsets

    return {
      internos: internos?.map((row) => sanitizeString(row.Interno)).filter((value): value is string => Boolean(value)) ?? [],
      servicios: servicios?.map((row) => sanitizeString(row.Servicio)).filter((value): value is string => Boolean(value)) ?? [],
      conductores:
        conductores?.map((row) => sanitizeString(row.Conductor)).filter((value): value is string => Boolean(value)) ?? [],
      tipos: tipos?.map((row) => sanitizeString(row.Tipo)).filter((value): value is string => Boolean(value)) ?? [],
      lugares: lugares?.map((row) => sanitizeString(row.Lugar)).filter((value): value is string => Boolean(value)) ?? [],
    }
  }
}
