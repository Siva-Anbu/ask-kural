import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { message, name } = await req.json();
    if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    const cleanName = name?.trim() || 'Anonymous';
    const cleanMsg  = message.trim();

    // Always save to Supabase so nothing is lost
    await supabase.from('feedback').insert({ name: cleanName, message: cleanMsg });

    // Send email — recipient address lives only in env vars, never in source
    const apiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.FEEDBACK_TO_EMAIL;

    if (apiKey && toEmail) {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: 'Ask Kural <onboarding@resend.dev>',
        to: toEmail,
        subject: `New feedback — Ask Kural`,
        html: `
          <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:28px;background:#0f0e0b;color:#e5e7eb;border-radius:12px;">
            <h2 style="color:#d4af7a;margin:0 0 6px;">திருக்குறள் உரை · Ask Kural</h2>
            <p style="font-size:12px;color:#6b7280;margin:0 0 24px;letter-spacing:.06em;">NEW FEEDBACK</p>
            <p style="margin:0 0 6px;font-size:13px;color:#9ca3af;"><strong style="color:#d4af7a;">From:</strong> ${cleanName}</p>
            <blockquote style="border-left:3px solid rgba(212,175,122,.5);margin:16px 0;padding:12px 16px;background:rgba(212,175,122,.06);border-radius:0 8px 8px 0;">
              <p style="margin:0;font-size:15px;line-height:1.7;color:#e5e7eb;">${cleanMsg}</p>
            </blockquote>
            <p style="margin:24px 0 0;font-size:11px;color:#374151;">a small tribute to kural · குறளுக்கு ஒரு சிறு காணிக்கை</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Feedback error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
