import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

function validateAdminKey(request: Request): boolean {
  const authHeader = request.headers.get('x-admin-key');
  const adminKey = process.env.ADMIN_SECRET_KEY;
  return !!adminKey && authHeader === adminKey;
}

// GET: Fetch all registrations with clean classification
export async function GET(request: Request) {
  if (!validateAdminKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServerClient();

    // Auto-cleanup stale reservations older than expires_at before fetching
    await supabase
      .from('registrations')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('status', 'reserved')
      .lt('expires_at', new Date().toISOString());

    const { data, error } = await supabase.rpc('get_all_registrations');

    if (error) {
      console.error('Admin fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 });
    }

    // Get slot counts too
    const { data: counts } = await supabase.rpc('get_slot_counts');
    const slotCounts = Array.isArray(counts) ? counts[0] : counts;

    // Generate signed URLs for screenshots
    const registrations = await Promise.all(
      (data || []).map(async (reg: Record<string, unknown>) => {
        if (reg.screenshot_url) {
          const { data: signedData } = await supabase.storage
            .from('receipts')
            .createSignedUrl(reg.screenshot_url as string, 3600);
          return { ...reg, screenshot_signed_url: signedData?.signedUrl || null };
        }
        return { ...reg, screenshot_signed_url: null };
      })
    );

    return NextResponse.json({
      registrations,
      slotCounts,
    });
  } catch (error) {
    console.error('Admin endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Update registration status or purge abandoned locks
export async function POST(request: Request) {
  if (!validateAdminKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const supabase = createServerClient();

    // Handle purge action
    if (body.action === 'purge_expired') {
      await supabase
        .from('registrations')
        .delete()
        .eq('status', 'reserved')
        .lt('expires_at', new Date().toISOString());

      await supabase
        .from('registrations')
        .delete()
        .eq('status', 'expired');

      return NextResponse.json({ success: true, message: 'Purged all expired and abandoned locks' });
    }

    const { id, status } = body;

    if (!id || !['verified', 'rejected', 'expired'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { error } = await supabase.rpc('update_registration_status', {
      p_id: id,
      p_status: status,
    });

    if (error) {
      console.error('Admin status update error:', error);
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin post error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
