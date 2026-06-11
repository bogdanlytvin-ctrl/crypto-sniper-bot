import { NextResponse } from 'next/server';
import { getRecentScanLogs, getApiLogLines } from '@/lib/logger';

export async function GET() {
  try {
    const scanLogs = getRecentScanLogs(20);
    const apiLogs = getApiLogLines(50);

    return NextResponse.json({
      scanLogs,
      apiLogs,
      totalScansLogged: scanLogs.length,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to read logs' }, { status: 500 });
  }
}
