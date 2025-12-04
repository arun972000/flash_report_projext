import { NextResponse } from 'next/server';

// ⬇️ Add this
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const segmentName = searchParams.get('segmentName');

    const token = 'your-very-strong-random-string-here';

    // Fetch hierarchy and volume data
    const [hierarchyRes, volumeRes] = await Promise.all([
      fetch('https://raceautoanalytics.com/api/contentHierarchy', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
      fetch('https://raceautoanalytics.com/api/volumeData', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
    ]);

    const hierarchyData = await hierarchyRes.json();
    const volumeData = await volumeRes.json();

    // Build full path string from node to root
    const buildPath = (id) => {
      const path = [];
      let current = hierarchyData.find((n) => n.id === id);
      while (current) {
        path.unshift(current.id);
        current = hierarchyData.find((n) => n.id === current.parent_id);
      }
      return path.join(',');
    };

    // Find segment node
    const segmentNode = hierarchyData.find(
      (n) => n.name.toLowerCase().trim() === segmentName.toLowerCase()
    );
    if (!segmentNode) return NextResponse.json({}, { status: 404 });

    // Use system year
    const currentYear = new Date().getFullYear().toString();

    // Find year node under segment
    const yearNode = hierarchyData.find(
      (n) => n.name === currentYear && n.parent_id === segmentNode.id
    );
    if (!yearNode) return NextResponse.json({}, { status: 404 });

    // Get all month nodes for current year
    const monthNodes = hierarchyData.filter((n) => n.parent_id === yearNode.id);
    const monthsList = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

    // Get "current" and "previous" months (1 month before current system month)
    const systemMonthIndex = new Date().getMonth(); // 0-indexed
    const effectiveIndex = systemMonthIndex - 1 >= 0 ? systemMonthIndex - 1 : 11;
    const previousIndex = effectiveIndex - 1 >= 0 ? effectiveIndex - 1 : 11;

    const currMonthName = monthsList[effectiveIndex];
    const prevMonthName = monthsList[previousIndex];

    const currNode = monthNodes.find((n) => n.name.toLowerCase().trim() === currMonthName);
    const prevNode = monthNodes.find((n) => n.name.toLowerCase().trim() === prevMonthName);

    if (!currNode || !prevNode) return NextResponse.json({}, { status: 404 });

    // Match stream paths
    const currStream = buildPath(currNode.id);
    const prevStream = buildPath(prevNode.id);

    const currEntry = volumeData.find((v) => v.stream === currStream);
    const prevEntry = volumeData.find((v) => v.stream === prevStream);

    const result = {};

    for (const [name, value] of Object.entries(prevEntry?.data?.data || {})) {
      if (!result[name]) result[name] = {};
      result[name][`${prevMonthName.toUpperCase()}’${currentYear.slice(-2)}`] = value;
    }

    for (const [name, value] of Object.entries(currEntry?.data?.data || {})) {
      if (!result[name]) result[name] = {};
      result[name][`${currMonthName.toUpperCase()}’${currentYear.slice(-2)}`] = value;
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('Bar API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
