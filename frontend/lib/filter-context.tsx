"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import type { Filtros } from "./types"
import { useQueryParams } from "@/hooks/use-query-params"

interface FilterContextType {
  filters: Filtros
  updateFilters: (newFilters: Partial<Filtros>) => void
  resetFilters: () => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  resultCount: number
  setResultCount: (count: number) => void
  queryTime: number
  setQueryTime: (time: number) => void
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

const defaultFilters: Filtros = {
  from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days ago
  to: new Date().toISOString().split("T")[0], // today
  page: 1,
  pageSize: 50,
  sortBy: "fecha",
  sortDir: "desc",
}

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const { updateURL, parseFiltersFromURL } = useQueryParams()
  const [filters, setFilters] = useState<Filtros>(() => ({ ...defaultFilters }))
  const hydrationCompleteRef = useRef(false)
  const shouldSyncRef = useRef(false)
  const [isLoading, setIsLoading] = useState(false)
  const [resultCount, setResultCount] = useState(0)
  const [queryTime, setQueryTime] = useState(0)

  useEffect(() => {
    if (hydrationCompleteRef.current) return
    const parsed = parseFiltersFromURL()
    if (Object.keys(parsed).length) {
      setFilters((prev) => ({
        ...prev,
        ...parsed,
        page: parsed.page ?? 1,
        pageSize: parsed.pageSize ?? prev.pageSize,
      }))
    }
    hydrationCompleteRef.current = true
  }, [parseFiltersFromURL])

  useEffect(() => {
    if (!hydrationCompleteRef.current) return
    if (!shouldSyncRef.current) {
      shouldSyncRef.current = true
      return
    }
    updateURL(filters)
  }, [filters, updateURL])

  const updateFilters = useCallback((newFilters: Partial<Filtros>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page !== undefined ? newFilters.page : 1,
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(() => ({ ...defaultFilters }))
    setResultCount(0)
    setQueryTime(0)
  }, [])

  return (
    <FilterContext.Provider
      value={{
        filters,
        updateFilters,
        resetFilters,
        isLoading,
        setIsLoading,
        resultCount,
        setResultCount,
        queryTime,
        setQueryTime,
      }}
    >
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error("useFilters must be used within a FilterProvider")
  }
  return context
}
