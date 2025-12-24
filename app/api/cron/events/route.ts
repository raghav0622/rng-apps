import { eventWorker } from '@/core/events/event-worker.service';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // No caching

export async function GET(request: Request) {
  // Security: Check for CRON secret header (Optional but recommended)
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { return new NextResponse('Unauthorized', { status: 401 }); }

  const result = await eventWorker.processBatch(20);
  return NextResponse.json(result);
}
