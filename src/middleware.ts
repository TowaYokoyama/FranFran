import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// 保護対象とするルートを定義します
const isProtectedRoute = createRouteMatcher([
  '/history(.*)',
  '/settings(.*)',
  '/api/(.*)' // APIルート全体を保護対象に
]);

export default clerkMiddleware(async (auth, req) => {
  // 保護対象外のルートは何もしない
  if (!isProtectedRoute(req)) {
    return NextResponse.next();
  }

  // 保護対象ルートの場合、ユーザーIDを取得します
  const { userId } = await auth();

  // ユーザーIDが存在しない（＝未ログイン）の場合
  if (!userId) {
    // ★★★ここからが修正箇所★★★
    // リクエストがAPIルートの場合
    if (req.nextUrl.pathname.startsWith('/api')) {
      // 401 Unauthorizedエラーを返す
      return new NextResponse(
        JSON.stringify({ message: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // リクエストがページの場合、サインインページにリダイレクト
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
    // ★★★ここまで★★★
  }

  // ログイン済みの場合は、そのままアクセスを許可します
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!.*\\..*|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};