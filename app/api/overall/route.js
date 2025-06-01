import db from "@/lib/db";
import { NextResponse } from "next/server";
import { format, subMonths, addMonths, parse, parseISO } from "date-fns";

// No need to parse percentages now
const parseValue = (val) => {
  const num =
    typeof val === "string" ? parseFloat(val.replace("%", "").trim()) : val;
  return isNaN(num) ? null : num;
};

export async function GET() {
  try {
    const now = new Date();

    const currentMonthStr = format(now, "MMM-yy");

    const [found] = await db.execute(
      `SELECT month FROM overall_automative_industry_line WHERE month = ? LIMIT 1`,
      [currentMonthStr]
    );

    let centerMonthStr = currentMonthStr;

    if (found.length === 0) {
      const [allMonthsResult] = await db.execute(
        `SELECT month FROM overall_automative_industry_line`
      );

      const monthsDates = allMonthsResult
        .map(({ month }) => {
          const parsed = parse(month, "MMM-yy", new Date());
          return { month, date: parsed };
        })
        .filter(({ date }) => !isNaN(date));

      const priorMonths = monthsDates.filter(({ date }) => date <= now);

      if (priorMonths.length === 0) {
        const earliest = monthsDates.reduce(
          (a, b) => (a.date < b.date ? a : b),
          monthsDates[0]
        );
        centerMonthStr = earliest.month;
      } else {
        const latestPrior = priorMonths.reduce(
          (a, b) => (a.date > b.date ? a : b),
          priorMonths[0]
        );
        centerMonthStr = latestPrior.month;
      }
      console.log(`Invalid centerMonthStr, using ${centerMonthStr} instead`);
    }

    const centerDate = parse(centerMonthStr, "MMM-yy", new Date());

    const startDate = format(subMonths(centerDate, 3), "yyyy-MM-dd");
    const endDate = format(addMonths(centerDate, 3), "yyyy-MM-dd");

    const [rows] = await db.execute(
      `
      SELECT 
        month,
        two_wheeler AS '2-wheeler',
        three_wheeler AS '3-wheeler',
        passenger,
        cv,
        tractor,
        total
      FROM overall_automative_industry_line
      WHERE STR_TO_DATE(CONCAT('01-', month), '%d-%b-%y') BETWEEN ? AND ?
      ORDER BY STR_TO_DATE(CONCAT('01-', month), '%d-%b-%y') ASC
      `,
      [startDate, endDate]
    );

    // Transform month format in the result
    const formattedRows = rows.map((row) => {
      const parsedDate = parse(row.month, "MMM-yy", new Date());
      return {
        ...row,
        month: format(parsedDate, "yyyy-MM"),
      };
    });

    return NextResponse.json(formattedRows);
  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const rawData = body.data; // rawData is in transposed format (months as columns)

    if (!Array.isArray(rawData)) {
      return NextResponse.json(
        { error: "Invalid data format: data must be an array" },
        { status: 400 }
      );
    }

    const months = Object.keys(rawData[0]).filter((key) => key !== "category");

    for (const month of months) {
      const row = {
        month,
        two_wheeler: null,
        three_wheeler: null,
        passenger: null,
        cv: null,
        tractor: null,
        total: null,
      };

      for (const record of rawData) {
        const category = record.category?.toLowerCase().replace(/-/g, "_");
        if (category in row) {
          row[category] = parseValue(record[month]);
        }
      }

      await db.execute(
        `INSERT INTO overall_automative_industry_line
         (month, two_wheeler, three_wheeler, passenger, cv, tractor, total)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           two_wheeler = VALUES(two_wheeler),
           three_wheeler = VALUES(three_wheeler),
           passenger = VALUES(passenger),
           cv = VALUES(cv),
           tractor = VALUES(tractor),
           total = VALUES(total)`,
        [
          month,
          row.two_wheeler,
          row.three_wheeler,
          row.passenger,
          row.cv,
          row.tractor,
          row.total,
        ]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DB Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
