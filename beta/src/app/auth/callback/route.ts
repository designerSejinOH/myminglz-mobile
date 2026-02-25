import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Supabase 이메일 인증 링크에서 code를 받아 세션으로 교환하는 콜백 라우트
// 이메일 링크 클릭 → /auth/callback?code=... → 세션 생성 → 온보딩으로 이동
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // 이메일 인증 완료 → 프로필 설정(온보딩)으로 이동
      return NextResponse.redirect(`${origin}/auth/onboarding`)
    }
  }

  // code가 없거나 교환 실패 → 회원가입 페이지로
  return NextResponse.redirect(`${origin}/auth/signup`)
}
