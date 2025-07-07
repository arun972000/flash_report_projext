// File: app/api/graphs/route.js
import pool from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id, 
        name, 
        dataset_ids, 
        forecast_types, 
        chart_type, 
        ai_forecast, 
        race_forecast, 
        created_at 
      FROM graphs 
      ORDER BY created_at DESC
    `);
    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("GET /api/graphs error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req) {
  try {
    const {
      name,
      datasetIds,
      forecastTypes,
      chartType,
      aiForecast,
      raceForecast,
    } = await req.json();

    if (!name || !datasetIds || !chartType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (chartType === "line" && (!aiForecast || !raceForecast)) {
      return new Response(
        JSON.stringify({
          error: "AI and Race forecast data are required for line chart",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const [result] = await pool.query(
      `INSERT INTO graphs 
        (name, dataset_ids, forecast_types, chart_type, ai_forecast, race_forecast)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name,
        JSON.stringify(datasetIds),
        JSON.stringify(forecastTypes || []),
        chartType,
        aiForecast ? JSON.stringify(aiForecast) : null,
        raceForecast ? JSON.stringify(raceForecast) : null,
      ]
    );

    return new Response(
      JSON.stringify({
        id: result.insertId,
        name,
        datasetIds,
        forecastTypes,
        chartType,
        aiForecast,
        raceForecast,
        createdAt: new Date().toISOString(),
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("POST /api/graphs error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PUT(req) {
  try {
    const {
      id,
      name,
      datasetIds,
      forecastTypes,
      chartType,
      aiForecast,
      raceForecast,
    } = await req.json();

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing graph id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const [result] = await pool.query(
      `UPDATE graphs SET 
        name = ?, 
        dataset_ids = ?, 
        forecast_types = ?, 
        chart_type = ?, 
        ai_forecast = ?, 
        race_forecast = ?
       WHERE id = ?`,
      [
        name || null,
        datasetIds ? JSON.stringify(datasetIds) : null,
        forecastTypes ? JSON.stringify(forecastTypes) : JSON.stringify([]),
        chartType || null,
        aiForecast ? JSON.stringify(aiForecast) : null,
        raceForecast ? JSON.stringify(raceForecast) : null,
        id,
      ]
    );

    return new Response(
      JSON.stringify({ message: "Graph updated successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("PUT /api/graphs error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) {
      return new Response(JSON.stringify({ error: "Missing graph id" }), {
        status: 400,
      });
    }
    await pool.query("DELETE FROM graphs WHERE id = ?", [id]);
    return new Response(JSON.stringify({ message: "Graph deleted" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("DELETE /api/graphs error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
