import { JobProcessor } from '@/features/jobs/jobs.processor';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Ensure it runs freshly

export async function GET(req: NextRequest) {
  // Security: Check for a CRON_SECRET if deployed
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await JobProcessor.processPendingEvents();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
