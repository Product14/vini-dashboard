import { NextRequest, NextResponse } from 'next/server';
import { getAllStatuses, upsertStatus } from '@/lib/notion';

export async function GET() {
  try {
    const statuses = await getAllStatuses();
    return NextResponse.json(statuses);
  } catch (err) {
    console.error('GET /api/statuses error:', err);
    return NextResponse.json({}, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { rooftopKey, rooftopName, enterprise, statuses } = await req.json();
    if (!rooftopKey || !statuses) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    await upsertStatus(rooftopKey, rooftopName ?? '', enterprise ?? '', statuses);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('POST /api/statuses error:', err);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
