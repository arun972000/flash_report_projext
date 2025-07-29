// File: app/api/saveScores/route.js

import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
  const url = new URL(request.url);
  const graphId = url.searchParams.get("graphId");
  const email   = url.searchParams.get("email");   // ← new

  let conn;
  try {
    conn = await db.getConnection();

    // Base SQL
    let sql = `
      SELECT
        s.id            AS submissionId,
        s.created_at    AS createdAt,
        s.user_email    AS userEmail,
        s.graph_id      AS graphId,
        ss.question_id  AS questionId,
        ss.year_index   AS yearIndex,
        ss.score        AS scoreValue,
        ss.skipped      AS skipped
      FROM submissions s
      JOIN submission_scores ss
        ON ss.submission_id = s.id
    `;
    const params = [];

    // build WHERE clauses
    const wheres = [];
    if (graphId) {
      wheres.push(`s.graph_id = ?`);
      params.push(graphId);
    }
    if (email) {
      wheres.push(`s.user_email = ?`);
      params.push(email);
    }
    if (wheres.length) {
      sql += ` WHERE ` + wheres.join(" AND ");
    }

    sql += `
      ORDER BY
        s.created_at DESC,
        ss.question_id,
        ss.year_index
    `;

    const [rows] = await conn.query(sql, params);

    // Group rows into submissions
    const map = new Map();
    for (const r of rows) {
      const {
        submissionId,
        createdAt,
        userEmail,
        graphId,
        questionId,
        yearIndex,
        scoreValue,
        skipped,
      } = r;

      if (!map.has(submissionId)) {
        map.set(submissionId, {
          id: submissionId,
          createdAt,
          userEmail,
          graphId,
          scores: [],
        });
      }
      map.get(submissionId).scores.push({
        questionId,
        yearIndex,
        score: scoreValue,
        skipped: Boolean(skipped),
      });
    }

    return NextResponse.json({ submissions: Array.from(map.values()) });
  } catch (err) {
    console.error("GET /api/saveScores error", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}


export async function POST(request) {
  const { user, graphId, results } = await request.json();
  if (!user || !graphId || !Array.isArray(results)) {
    return new Response("Invalid payload", { status: 400 });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Insert a new submission with user_email AND graph_id
    const [subRes] = await conn.query(
      "INSERT INTO submissions (user_email, graph_id) VALUES (?, ?)",
      [user, graphId]
    );
    const submissionId = subRes.insertId;

    // 2) Build rows for submission_scores (unchanged)
    const rows = [];
    for (const r of results) {
      const qId = r.questionId;
      if (r.skipped) {
        rows.push([submissionId, qId, null, null, true]);
      } else {
        for (let yearIndex = 0; yearIndex < r.scores.length; yearIndex++) {
          rows.push([
            submissionId,
            qId,
            yearIndex,
            r.scores[yearIndex] ?? null,
            false,
          ]);
        }
      }
    }

    // 3) Bulk insert scores
    if (rows.length) {
      await conn.query(
        `INSERT INTO submission_scores
          (submission_id, question_id, year_index, score, skipped)
         VALUES ?`,
        [rows]
      );
    }

    await conn.commit();
    return new Response(JSON.stringify({ success: true, submissionId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    await conn.rollback();
    console.error("POST /api/saveScores error", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    conn.release();
  }
}

export async function DELETE(request) {
  const { id } = await request.json();
  if (!id) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing submission id" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Delete all scores for this submission
    await conn.query("DELETE FROM submission_scores WHERE submission_id = ?", [
      id,
    ]);

    // 2) Delete the submission record
    await conn.query("DELETE FROM submissions WHERE id = ?", [id]);

    await conn.commit();
    return new Response(JSON.stringify({ success: true, deletedId: id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    await conn.rollback();
    console.error("DELETE /api/saveScores error", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    conn.release();
  }
}
