import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const revalidate = 5; // Cache for 5 seconds

export async function GET() {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase.rpc('get_slot_counts');

    if (error) {
      // Return safe defaults if DB is fresh or tables are pending
      return NextResponse.json(
        {
          early_bird_taken: 0,
          early_bird_total: 10,
          regular_taken: 0,
          total_taken: 0,
          total_capacity: 40,
        },
        { status: 200 }
      );
    }

    const result = Array.isArray(data) ? data[0] : data;

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        early_bird_taken: 0,
        early_bird_total: 10,
        regular_taken: 0,
        total_taken: 0,
        total_capacity: 40,
      },
      { status: 200 }
    );
  }
}
