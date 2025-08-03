import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const segmentName = searchParams.get('segmentName')?.toLowerCase()?.trim();
    if (!segmentName) {
      return NextResponse.json({ error: 'Missing segmentName' }, { status: 400 });
    }

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

    const monthsList = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const currentYear = new Date().getFullYear().toString();

    // Build full path from node ID
    const buildPath = (id) => {
      const path = [];
      let current = hierarchyData.find(n => n.id === id);
      while (current) {
        path.unshift(current.id);
        current = hierarchyData.find(n => n.id === current.parent_id);
      }
      return path.join(',');
    };

    // Step 1: Resolve hierarchy nodes
    const segment = hierarchyData.find(n => n.name.toLowerCase().trim() === segmentName);
    if (!segment) return NextResponse.json([], { status: 404 });

    const splitNode = hierarchyData.find(n => n.name.toLowerCase() === 'segment split' && n.parent_id === segment.id);
    if (!splitNode) return NextResponse.json([], { status: 404 });

    const yearNode = hierarchyData.find(n => n.name === currentYear && n.parent_id === splitNode.id);
    if (!yearNode) return NextResponse.json([], { status: 404 });

    const monthNodes = hierarchyData.filter(n => n.parent_id === yearNode.id);

    // Step 2: Determine target 10-month window
    const systemMonthIndex = new Date().getMonth(); // 0-based (Jan = 0)
    const effectiveCurrent = systemMonthIndex - 1 >= 0 ? systemMonthIndex - 1 : 11;

    const targetLabels = new Set();
    for (let offset = -3; offset <= 6; offset++) {
      const d = new Date(new Date().getFullYear(), effectiveCurrent + offset);
      const label = `${monthsList[d.getMonth()].toUpperCase()}-${d.getFullYear().toString().slice(-2)}`;
      targetLabels.add(label);
    }

    // Step 3: Parse numbers safely (handles commas like "8,3")
    const parseNumber = (val) => {
      if (typeof val === 'string') {
        val = val.replace(',', '.');
      }
      return parseFloat(val) || 0;
    };

    const result = [];

    for (const monthNode of monthNodes) {
      const monthIndex = monthsList.indexOf(monthNode.name.toLowerCase());
      if (monthIndex === -1) continue;

      const label = `${monthsList[monthIndex].toUpperCase()}-${currentYear.slice(-2)}`;
      if (!targetLabels.has(label)) continue;

      const stream = buildPath(monthNode.id);
      const volumeEntry = volumeData.find(v => v.stream === stream);
      if (!volumeEntry || !volumeEntry.data || !volumeEntry.data.data) continue;

      const raw = volumeEntry.data.data;

      const LCV = parseNumber(raw['LCV']);
      const MCV = parseNumber(raw['MCV']);
      const HCV = parseNumber(raw['HCV']);

      const total = LCV + MCV + HCV;
      if (total === 0) {
        console.warn(`⚠️ Zero volume for ${label}:`, { LCV, MCV, HCV });
        continue;
      }

      result.push({
        month: label,
        lcv: (LCV / total) * 100,
        mcv: (MCV / total) * 100,
        hcv: (HCV / total) * 100,
      });
    }

    // Sort by actual date order
    result.sort((a, b) => {
      const getDate = (label) => new Date(`01-${label.replace('-', '-20')}`);
      return getDate(a.month) - getDate(b.month);
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('CV Segment API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
