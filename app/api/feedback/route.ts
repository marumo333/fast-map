import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

type Feedback = {
  routeId: number;
  rating: number;
  comment: string;
};

// フィードバックデータの保存（実際のアプリケーションではデータベースを使用）
const feedbacks: Feedback[] = [];

// 許可するオリジンを列挙
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://fast-map-five.vercel.app',
  'https://fast-6ir0sv4r8-marumo333s-projects.vercel.app'
];

// CORSヘッダーを設定する関数
function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

// プリフライトリクエストのハンドラ
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { 
    status: 204,
    headers: getCorsHeaders(origin)
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  
  // オリジンの検証
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json(
      { error: '許可されていないオリジンからのリクエストです' },
      { 
        status: 403,
        headers: getCorsHeaders(origin)
      }
    );
  }

  try {
    const body = await request.json();
    const { routeId, rating, comment } = body;

    // バリデーション
    if (!routeId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: '無効なフィードバックデータです' },
        { status: 400 }
      );
    }

    // フィードバックを保存
    const feedback: Feedback = {
      routeId,
      rating,
      comment: comment || ''
    };

    feedbacks.push(feedback);

    // 成功レスポンス
    return NextResponse.json({
      message: 'フィードバックが保存されました',
      feedback
    }, { headers: getCorsHeaders(origin) });
  } catch (error) {
    console.error('フィードバック保存エラー:', error);
    return NextResponse.json(
      { error: 'フィードバックの保存に失敗しました' },
      { status: 500, headers: getCorsHeaders(origin) }
    );
  }
}

export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  
  // オリジンの検証
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json(
      { error: '許可されていないオリジンからのリクエストです' },
      { 
        status: 403,
        headers: getCorsHeaders(origin)
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const routeId = searchParams.get('routeId');

  if (routeId) {
    const routeFeedbacks = feedbacks.filter(
      (f) => f.routeId === parseInt(routeId, 10)
    );
    return NextResponse.json(
      { feedbacks: routeFeedbacks },
      { headers: getCorsHeaders(origin) }
    );
  }

  return NextResponse.json(
    { feedbacks },
    { headers: getCorsHeaders(origin) }
  );
} 