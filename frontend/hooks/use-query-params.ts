"use client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useCallback } from "react"
import type { Filtros } from "@/lib/types"

function toCommaSeparated(values?: string[]): string | undefined {
  if (!values || values.length === 0) {
    return undefined
  }
  return values.join(",")
}

function parseCommaSeparated(value: string | null): string[] | undefined {
  if (!value) {
    return undefined
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

export function useQueryParams() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createQueryString = useCallback((filters: Filtros) => {
    const params = new URLSearchParams()

    params.set("from", filters.from)
    params.set("to", filters.to)

    const interno = toCommaSeparated(filters.interno)
    if (interno) {
      params.set("interno", interno)
    }

    const servicio = toCommaSeparated(filters.servicio)
    if (servicio) {
      params.set("servicio", servicio)
    }

    const conductor = toCommaSeparated(filters.conductor)
    if (conductor) {
      params.set("conductor", conductor)
    }

    const tipo = toCommaSeparated(filters.tipo)
    if (tipo) {
      params.set("tipo", tipo)
    }

    const lugar = toCommaSeparated(filters.lugar)
    if (lugar) {
      params.set("lugar", lugar)
    }

    if (filters.page && filters.page > 1) {
      params.set("page", filters.page.toString())
    }

    if (filters.pageSize && filters.pageSize !== 50) {
      params.set("pageSize", filters.pageSize.toString())
    }

    if (filters.sortBy && filters.sortBy !== "fecha") {
      params.set("sortBy", filters.sortBy)
    }

    if (filters.sortDir && filters.sortDir !== "desc") {
      params.set("sortDir", filters.sortDir)
    }

    return params.toString()
  }, [])

  const updateURL = useCallback(
    (filters: Filtros) => {
      const queryString = createQueryString(filters)
      router.push(`${pathname}?${queryString}`)
    },
    [pathname, router, createQueryString],
  )

  const parseFiltersFromURL = useCallback((): Partial<Filtros> => {
    const filters: Partial<Filtros> = {}

    const from = searchParams.get("from")
    const to = searchParams.get("to")

    if (from) filters.from = from
    if (to) filters.to = to

    filters.interno = parseCommaSeparated(searchParams.get("interno") || searchParams.get("idInterno"))
    filters.servicio = parseCommaSeparated(searchParams.get("servicio") || searchParams.get("idServicio"))
    filters.conductor = parseCommaSeparated(searchParams.get("conductor") || searchParams.get("idConductor"))
    filters.tipo = parseCommaSeparated(searchParams.get("tipo"))
    filters.lugar = parseCommaSeparated(searchParams.get("lugar"))

    const page = searchParams.get("page")
    if (page) {
      filters.page = Number.parseInt(page, 10)
    }

    const pageSize = searchParams.get("pageSize")
    if (pageSize) {
      filters.pageSize = Number.parseInt(pageSize, 10)
    }

    const sortBy = searchParams.get("sortBy")
    if (sortBy) {
      filters.sortBy = sortBy as Filtros["sortBy"]
    }

    const sortDir = searchParams.get("sortDir")
    if (sortDir === "asc" || sortDir === "desc") {
      filters.sortDir = sortDir
    }

    return filters
  }, [searchParams])

  return {
    updateURL,
    parseFiltersFromURL,
    createQueryString,
  }
}
