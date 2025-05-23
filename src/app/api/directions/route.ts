import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const routeId = searchParams.get('route_id');

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return NextResponse.json(
      { error: 'Google Maps APIキーが設定されていません' },
      { status: 500 }
    );
  }

  try {
    let url = 'https://maps.googleapis.com/maps/api/directions/json?';
    
    if (routeId) {
      url += `route_id=${routeId}`;
    } else if (origin && destination) {
      url += `origin=${origin}&destination=${destination}&alternatives=true`;
    } else {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      );
    }

    url += `&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&departure_time=now&traffic_model=best_guess`;

    const response = await fetch(url);
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Google Maps APIエラー:', error);
    return NextResponse.json(
      { error: 'Google Maps APIの呼び出しに失敗しました' },
      { status: 500 }
    );
  }
} 