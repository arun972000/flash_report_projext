// lib/flashReportsServer.ts
import "server-only";

const monthsList = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

export type OverallChartPoint = {
  month: string; // "YYYY-MM"
  data: {
    [key: string]: number; // 2W, 3W, PV, TRAC, Truck, Bus, CV, Total
  };
};

function mapBackendKeyToCategory(normalizedKey: string): string | null {
   if (
    normalizedKey === 'two wheeler' ||
    normalizedKey === '2-wheeler' ||
    normalizedKey === 'two-wheeler' ||
    normalizedKey === '2w'
  ) return '2W';

  if (
    normalizedKey === 'three wheeler' ||
    normalizedKey === '3-wheeler' ||
    normalizedKey === 'three-wheeler' ||
    normalizedKey === '3w'
  ) return '3W';

  if (
    normalizedKey === "passenger" ||
    normalizedKey === "passenger vehicle" ||
    normalizedKey === "pv"
  )
    return "PV";

  if (normalizedKey === "tractor" || normalizedKey === "trac") return "TRAC";

  if (normalizedKey === "cv" || normalizedKey === "commercial vehicle")
    return "CV";

  if (normalizedKey === "truck") return "Truck";
  if (normalizedKey === "bus") return "Bus";

  return null;
}

// ---- OVERALL CHART DATA (SERVER) ----

export async function getOverallChartData(): Promise<OverallChartPoint[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not set");
  }

  // IMPORTANT: keep this secret on the server, not in client code
  const token = process.env.BACKEND_API_TOKEN; // e.g. set in .env.local
  if (!token) {
    throw new Error("BACKEND_API_TOKEN is not set");
  }

  const [hierarchyRes, volumeRes] = await Promise.all([
    fetch(`${baseUrl}api/contentHierarchy`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }),
    fetch(`${baseUrl}api/volumeData`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }),
  ]);

  if (!hierarchyRes.ok || !volumeRes.ok) {
    throw new Error("Failed to fetch content hierarchy or volume data");
  }

  const hierarchyData = await hierarchyRes.json();
  const volumeData = await volumeRes.json();

  // MAIN ROOT > flash-reports > overall
  const mainRoot = hierarchyData.find(
    (n: any) => n.name.toLowerCase() === "main root"
  );
  if (!mainRoot) return [];

  const flashReports = hierarchyData.find(
    (n: any) =>
      n.name.toLowerCase() === "flash-reports" && n.parent_id === mainRoot.id
  );
  if (!flashReports) return [];

  const overall = hierarchyData.find(
    (n: any) =>
      n.name.toLowerCase() === "overall" && n.parent_id === flashReports.id
  );
  if (!overall) return [];

  const yearNodes = hierarchyData.filter(
    (n: any) => n.parent_id === overall.id
  );

  // 10 target months: from 3 months before to 6 months after previous month
  const now = new Date();
  const currentMonthRef = new Date(now.getFullYear(), now.getMonth() - 1);

  const targetMonthsSet = new Set<string>();
  for (let offset = -3; offset <= 6; offset++) {
    const d = new Date(
      currentMonthRef.getFullYear(),
      currentMonthRef.getMonth() + offset
    );
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    targetMonthsSet.add(key);
  }

  const result: OverallChartPoint[] = [];

  for (const yearNode of yearNodes) {
    const year = yearNode.name;
    const monthNodes = hierarchyData.filter(
      (n: any) => n.parent_id === yearNode.id
    );

    for (const monthNode of monthNodes) {
      const monthIndex = monthsList.indexOf(monthNode.name.toLowerCase());
      if (monthIndex === -1) continue;

      const formattedMonth = `${year}-${String(monthIndex + 1).padStart(
        2,
        "0"
      )}`;
      if (!targetMonthsSet.has(formattedMonth)) continue;

      const streamPath = [
        mainRoot.id,
        flashReports.id,
        overall.id,
        yearNode.id,
        monthNode.id,
      ].join(",");

      const matchedEntry = volumeData.find((v: any) => v.stream === streamPath);
      if (!matchedEntry || !matchedEntry.data) continue;

      // 👇 NEW: handle the nested shape { data: {...}, total: ... }
      const rawData = (matchedEntry.data as any).data ?? matchedEntry.data;

      const data: Record<string, number> = {};

      for (const [key, value] of Object.entries(rawData)) {
        const normalizedKey = key.toLowerCase().trim();
        const catKey = mapBackendKeyToCategory(normalizedKey);
        if (!catKey) continue;
        data[catKey] = Number(value);
      }

      // derive Total like old code
      const catKeys = ["2W", "3W", "PV", "TRAC", "Truck", "Bus", "CV"];
      const total = catKeys.reduce((sum, k) => sum + (data[k] || 0), 0);
      data["Total"] = total;

      result.push({
        month: formattedMonth,
        data,
      });
    }
  }

  result.sort(
    (a, b) =>
      new Date(`${a.month}-01`).getTime() - new Date(`${b.month}-01`).getTime()
  );
  console.log(result);
  return result;
}

// ---- OVERALL PAGE TEXT (SERVER) ----

export async function getOverallText() {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not set");
  }

  const res = await fetch(
    `${baseUrl}api/admin/flash-dynamic/flash-reports-text`,
    { cache: "no-store" }
  );

  if (!res.ok) throw new Error("Failed to fetch overall text");
  return res.json();
}


export type MarketBarRawData = {
  // e.g. { "2W": { "Apr 2025": 23.4, "May 2025": 25.1 }, ... }
  [category: string]: {
    [monthLabel: string]: number;
  };
};

export async function getMarketBarRawData(
  segmentName: string
): Promise<MarketBarRawData | null> {
  // This calls your existing Next API route:
  // /api/fetchMarketBarData?segmentName=...
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  const res = await fetch(
    `${siteUrl}/api/fetchMarketBarData?segmentName=${encodeURIComponent(
      segmentName
    )}`,
    { cache: 'no-store' }
  );

  if (!res.ok) {
    console.error('Failed to fetch market bar data', res.status);
    return null;
  }

  const json = (await res.json()) as MarketBarRawData;
  console.log("overall bar data",json)
  return json;
}