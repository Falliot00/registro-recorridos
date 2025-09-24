import { NextResponse } from "next/server"
import { DatabaseMapper } from "@/lib/db-mapper"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const options = await DatabaseMapper.getFilterOptions()
    return NextResponse.json(options)
  } catch (error) {
    console.error("Error fetching filter options:", error)
    return NextResponse.json({ error: "Failed to fetch filter options" }, { status: 500 })
  }
}
