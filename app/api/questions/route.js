// File: app/api/questions/route.js
import pool from "@/lib/db";

export async function GET(req) {
  const url = new URL(req.url);
  const graphId = url.searchParams.get("graphId");
  if (!graphId) {
    return new Response(JSON.stringify({ error: "Missing graphId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const [rows] = await pool.query(
      "SELECT * FROM questions WHERE graph_id = ? ORDER BY created_at DESC",
      [graphId]
    );
    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("GET /api/questions error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}

export async function POST(req) {
  try {
    const { text, weight, type, graphId } = await req.json();
    if (!text || weight == null || !type || !graphId) {
      return new Response(
        JSON.stringify({
          error: "Missing fields (text, weight, type, graphId)",
        }),
        { status: 400 }
      );
    }
    const [result] = await pool.query(
      "INSERT INTO questions (text, weight, type, graph_id) VALUES (?, ?, ?, ?)",
      [text, weight, type, graphId]
    );
    const [newRow] = await pool.query("SELECT * FROM questions WHERE id = ?", [
      result.insertId,
    ]);
    return new Response(JSON.stringify(newRow[0]), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("POST /api/questions error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id)
      return new Response(JSON.stringify({ error: "Missing id" }), {
        status: 400,
      });
    await pool.query("DELETE FROM questions WHERE id = ?", [id]);
    return new Response(JSON.stringify({ message: "Deleted" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("DELETE /api/questions error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
