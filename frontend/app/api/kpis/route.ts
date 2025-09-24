import { type NextRequest, NextResponse } from "next/server"
import { DatabaseMapper } from "@/lib/db-mapper"
import { FiltrosSchema, KPIsSchema } from "@/lib/types"

function parseMultiValue(params: URLSearchParams, keys: string[]): string[] | undefined {
  for (const key of keys) {
    const value = params.get(key)
    if (value) {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    }
  }
  return undefined
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const filtersInput = {
      from: searchParams.get("from") || "",
      to: searchParams.get("to") || "",
      interno: parseMultiValue(searchParams, ["interno", "idInterno"]),
      servicio: parseMultiValue(searchParams, ["servicio", "idServicio"]),
      conductor: parseMultiValue(searchParams, ["conductor", "idConductor"]),
      tipo: parseMultiValue(searchParams, ["tipo"]),
      lugar: parseMultiValue(searchParams, ["lugar"]),
    }

    const validatedFilters = FiltrosSchema.parse(filtersInput)
    const kpis = await DatabaseMapper.getKPIs(validatedFilters)
    const validatedKPIs = KPIsSchema.parse(kpis)

    return NextResponse.json(validatedKPIs)
  } catch (error) {
    console.error("Error fetching KPIs:", error)
    return NextResponse.json({ error: "Failed to fetch KPIs" }, { status: 500 })
  }
}
