import { NextResponse } from 'next/server';

// ⬇️ Add this
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const segmentName = searchParams.get('segmentName');
    const segmentType = searchParams.get('segmentType') || "app";
    const selectedMonth = searchParams.get('selectedMonth');

    const token = "your-very-strong-random-string-here";

    const [hierarchyRes, volumeRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/contentHierarchy`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: 'no-store',
      }),
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/volumeData`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: 'no-store',
      }),
    ]);

    const hierarchyData = await hierarchyRes.json();
    const volumeData = await volumeRes.json();

    const buildPath = (id) => {
      const path = [];
      let current = hierarchyData.find((n) => n.id === id);
      while (current) {
        path.unshift(current.id);
        current = hierarchyData.find((n) => n.id === current.parent_id);
      }
      return path.join(",");
    };

    const segmentNode = hierarchyData.find(
      (n) => n.name.toLowerCase().trim() === segmentName.toLowerCase()
    );
    if (!segmentNode) return NextResponse.json([], { status: 404 });

    const marketShareNode = hierarchyData.find(
      (n) =>
        n.name.toLowerCase().trim() === segmentType.toLowerCase() &&
        n.parent_id === segmentNode.id
    );
    if (!marketShareNode) return NextResponse.json([], { status: 404 });

    const monthsList = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const month = selectedMonth || monthsList[new Date().getMonth() - 1];
console.log(month)
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    const currentYearNode = hierarchyData.find(
      (n) => n.name === String(currentYear) && n.parent_id === marketShareNode.id
    );
    const previousYearNode = hierarchyData.find(
      (n) => n.name === String(lastYear) && n.parent_id === marketShareNode.id
    );

    if (!currentYearNode || !previousYearNode) return NextResponse.json([], { status: 404 });

    const currentYearMonths = hierarchyData.filter((n) => n.parent_id === currentYearNode.id);
    const previousYearMonths = hierarchyData.filter((n) => n.parent_id === previousYearNode.id);

    const currentMonthNode = currentYearMonths.find((n) => n.name.toLowerCase().trim() === month);
    const prevMonthIndex = monthsList.indexOf(month) - 1;
    const previousMonthName = prevMonthIndex >= 0 ? monthsList[prevMonthIndex] : null;
    const previousMonthNode = previousMonthName
      ? currentYearMonths.find((n) => n.name.toLowerCase().trim() === previousMonthName)
      : null;

    const lastYearSameMonthNode = previousYearMonths.find(
      (n) => n.name.toLowerCase().trim() === month
    );

    const nodes = [previousMonthNode, currentMonthNode, lastYearSameMonthNode];

    const merged = {};

    for (const node of nodes) {
      if (!node) continue;
      const stream = buildPath(node.id);
      const volumeEntry = volumeData.find((v) => v.stream === stream);
      if (!volumeEntry) continue;

      const nodeYear = hierarchyData.find((n) => n.id === node.parent_id)?.name;
      const label = `${node.name} ${nodeYear}`;

      for (const [name, value] of Object.entries(volumeEntry.data.data)) {
        if (!merged[name]) merged[name] = { name };
        merged[name][label] = value;
      }
    }
// console.log(Object.values(merged))
    return NextResponse.json(Object.values(merged));

    
  } catch (err) {
    console.error("Server API error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
