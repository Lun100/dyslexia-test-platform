import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const extractAccessToken = (req: NextRequest) => {
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return null;
  }
  return authHeader.slice(7);
};

export async function GET(req: NextRequest) {
  try {
    const accessToken = extractAccessToken(req);
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient(accessToken);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'teacher')
      .limit(1);

    if (rolesError) {
      return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
    }

    if (!roles || roles.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json({ error: 'Failed to load results' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[results][GET] Failed to load results:', error);
    return NextResponse.json({ error: 'Failed to load results' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const accessToken = extractAccessToken(req);
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient(accessToken);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      category,
      setId,
      setName,
      answers,
      audioPath,
      startedAt,
      finishedAt,
      durationSeconds,
      totalQuestions,
      answeredCount,
    } = body ?? {};

    if (!category || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const insertPayload: Record<string, unknown> = {
      user_id: userData.user.id,
      category,
      set_id: setId,
      set_name: setName,
      answers,
      audio_path: audioPath ?? null,
      started_at: startedAt,
      finished_at: finishedAt,
      duration_seconds: durationSeconds,
      total_questions: totalQuestions,
      answered_count: answeredCount,
    };

    let { error } = await supabase.from('test_results').insert(insertPayload);

    if (error && (error as { code?: string; message?: string })?.message?.includes('audio_path')) {
      const fallbackPayload = { ...insertPayload };
      delete fallbackPayload.audio_path;
      const retry = await supabase.from('test_results').insert(fallbackPayload);
      error = retry.error;
    }

    if (error) {
      console.error('[results][POST] insert error:', error);
      return NextResponse.json({ error: 'Failed to save results' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Results saved' }, { status: 201 });
  } catch (error) {
    console.error('[results][POST] Failed to save results:', error);
    return NextResponse.json({ error: 'Failed to save results' }, { status: 500 });
  }
}
