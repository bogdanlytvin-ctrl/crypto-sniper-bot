import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const scans = await db.scan.findMany({
      where: { status: 'completed' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        url: true,
        riskScore: true,
        findings: true,
        metadata: true,
        createdAt: true,
        completedAt: true,
      },
    });

    const formatted = scans.map((scan) => ({
      id: scan.id,
      url: scan.url,
      riskScore: scan.riskScore,
      findings: JSON.parse(scan.findings || '[]'),
      summary: (JSON.parse(scan.metadata as string)?.summary) || null,
      createdAt: scan.createdAt.toISOString(),
      completedAt: scan.completedAt?.toISOString(),
    }));

    return NextResponse.json({ scans: formatted });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch scan history' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Require a confirmation header to prevent accidental/automated deletions
    const confirmHeader = request.headers.get('x-confirm-delete');
    if (confirmHeader !== 'true') {
      return NextResponse.json(
        { error: 'Confirmation required. Set header x-confirm-delete: true' },
        { status: 400 },
      );
    }

    const result = await db.scan.deleteMany();
    return NextResponse.json({
      success: true,
      deleted: result.count,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to clear history' }, { status: 500 });
  }
}
