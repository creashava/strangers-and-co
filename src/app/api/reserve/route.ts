import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { TicketTier } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tier: TicketTier = body.tier;

    if (!tier || tier !== 'regular') {
      return NextResponse.json(
        { success: false, message: 'Invalid pass tier selected' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await supabase.rpc('reserve_slot', {
      p_tier: tier,
      p_timeout_minutes: 7,
    });

    if (error) {
      console.error('Reservation RPC error:', error);
      if (error.code === 'PGRST202' || error.message?.includes('schema cache')) {
        return NextResponse.json(
          {
            success: false,
            message: 'Database setup in progress. Please run supabase/migration.sql in your Supabase SQL Editor.',
          },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to reserve slot. Please try again.' },
        { status: 500 }
      );
    }

    const result = Array.isArray(data) ? data[0] : data;

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Reserve endpoint error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
