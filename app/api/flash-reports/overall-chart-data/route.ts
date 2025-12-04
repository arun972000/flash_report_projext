import { NextResponse } from "next/server";
import { getOverallChartData } from "@/lib/flashReportsServer";

// ⬇️ Add this
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getOverallChartData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in overall-chart-data API:", error);
    return NextResponse.json(
      { error: "Failed to load overall chart data" },
      { status: 500 }
    );
  }
}
