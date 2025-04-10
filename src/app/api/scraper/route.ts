import { scrapeAndRank } from '@/lib/scraper';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, tags } = body;

    if (!query || !Array.isArray(tags)) {
      return NextResponse.json(
        { message: 'Missing query or tags' },
        { status: 400 }
      );
    }

    const results = await scrapeAndRank(query, tags);
    return NextResponse.json(results, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { message: 'Error scraping', error: (err as Error).message },
      { status: 500 }
    );
  }
}
