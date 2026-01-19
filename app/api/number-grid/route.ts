import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const gridFilePath = path.join(process.cwd(), 'app', 'data', 'number-grid.json');

export async function GET() {
  try {
    const data = await fs.readFile(gridFilePath, 'utf8');
    if (data.trim() === '') {
      return NextResponse.json([]);
    }
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json([]);
    }
    console.error('[number-grid][GET] Failed to read grid:', error);
    return NextResponse.json({ error: 'Failed to read number grid' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content } = body ?? {};

    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    if (!Array.isArray(parsed) || !parsed.every((row) => Array.isArray(row))) {
      return NextResponse.json({ error: 'Invalid grid format' }, { status: 400 });
    }

    await fs.writeFile(gridFilePath, JSON.stringify(parsed, null, 2));
    return NextResponse.json({ message: 'Number grid saved' }, { status: 201 });
  } catch (error) {
    console.error('[number-grid][POST] Failed to save grid:', error);
    return NextResponse.json({ error: 'Failed to save number grid' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await fs.writeFile(gridFilePath, JSON.stringify([], null, 2));
    return NextResponse.json({ message: 'Number grid cleared' }, { status: 200 });
  } catch (error) {
    console.error('[number-grid][DELETE] Failed to clear grid:', error);
    return NextResponse.json({ error: 'Failed to clear number grid' }, { status: 500 });
  }
}
