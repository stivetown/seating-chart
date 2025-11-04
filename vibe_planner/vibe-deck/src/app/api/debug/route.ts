import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const hasKV = !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
    
    return NextResponse.json({
      status: 'ok',
      hasKV,
      kvUrl: process.env.KV_REST_API_URL ? 'set' : 'not set',
      kvToken: process.env.KV_REST_API_TOKEN ? 'set' : 'not set',
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
