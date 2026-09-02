import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { UTR_REGEX, PHONE_REGEX, EMAIL_REGEX } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const reservationId = formData.get('reservation_id') as string;
    const fullName = formData.get('full_name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const utrNumber = formData.get('utr_number') as string;
    const screenshot = formData.get('screenshot') as File | null;

    // Validation
    if (!reservationId) {
      return NextResponse.json({ success: false, message: 'Missing reservation ID' }, { status: 400 });
    }
    if (!fullName || fullName.trim().length < 2) {
      return NextResponse.json({ success: false, message: 'Please enter your full name' }, { status: 400 });
    }
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ success: false, message: 'Please enter a valid email' }, { status: 400 });
    }
    if (!PHONE_REGEX.test(phone)) {
      return NextResponse.json({ success: false, message: 'Please enter a 10-digit mobile number' }, { status: 400 });
    }
    if (!UTR_REGEX.test(utrNumber)) {
      return NextResponse.json({ success: false, message: 'UTR / UPI Reference ID must be exactly 12 digits' }, { status: 400 });
    }

    const supabase = createServerClient();
    let screenshotUrl: string | null = null;

    // Upload screenshot if provided
    if (screenshot && screenshot.size > 0) {
      const fileExt = screenshot.name.split('.').pop() || 'png';
      const fileName = `${reservationId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, screenshot, {
          contentType: screenshot.type || 'image/png',
          upsert: true,
        });

      if (uploadError) {
        console.error('Screenshot upload error:', uploadError);
      } else {
        screenshotUrl = fileName;
      }
    }

    // Complete registration via RPC
    const { data, error } = await supabase.rpc('complete_registration', {
      p_reservation_id: reservationId,
      p_full_name: fullName.trim(),
      p_email: email.trim().toLowerCase(),
      p_phone: phone.trim(),
      p_utr_number: utrNumber.trim(),
      p_screenshot_url: screenshotUrl,
    });

    if (error) {
      console.error('Registration RPC error:', error);
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
        { success: false, message: error.message || 'Failed to complete registration. Please check your UTR.' },
        { status: 500 }
      );
    }

    const result = Array.isArray(data) ? data[0] : data;

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Register endpoint error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
