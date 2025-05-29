import { NextResponse } from 'next/server';

type Feedback = {
  routeId: number;
  rating: number;
  comment: string;
};

// フィードバックデータの保存（実際のアプリケーションではデータベースを使用）
const feedbacks: Feedback[] = [];

export async function POST(request: Request) {
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
    });
  } catch (error) {
    console.error('フィードバック保存エラー:', error);
    return NextResponse.json(
      { error: 'フィードバックの保存に失敗しました' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const routeId = searchParams.get('routeId');

  if (routeId) {
    const routeFeedbacks = feedbacks.filter(
      (f) => f.routeId === parseInt(routeId, 10)
    );
    return NextResponse.json({ feedbacks: routeFeedbacks });
  }

  return NextResponse.json({ feedbacks });
} 