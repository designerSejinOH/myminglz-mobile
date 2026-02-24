import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // 공개 라우트 (로그인 불필요)
  const publicRoutes = ['/']
  const isPublicRoute = publicRoutes.includes(pathname)

  // 인증 관련 라우트
  const authRoutes = ['/auth/verify']
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // 프로필 설정 라우트
  const profileSetupRoute = '/auth/onboarding'
  const isProfileSetupRoute = pathname.startsWith(profileSetupRoute)

  // 보호된 라우트 (로그인 + 이메일 확인 + 프로필 필요)
  const protectedRoutes = ['/map', '/feed', '/post', '/mypage']
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  // 1. 비로그인 사용자
  if (!user) {
    // 보호된 라우트, 인증 라우트, 프로필 설정 접근 시 홈으로
    if (isProtectedRoute || isAuthRoute || isProfileSetupRoute) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return supabaseResponse
  }

  // 2. 로그인된 사용자 - 이메일 확인 체크
  const isEmailVerified = !!user.email_confirmed_at

  if (!isEmailVerified) {
    // 이메일 미확인 시 verify 페이지만 허용
    if (!isAuthRoute && !isPublicRoute) {
      return NextResponse.redirect(new URL('/auth/verify', request.url))
    }
    return supabaseResponse
  }

  // 3. 이메일 확인된 사용자 - 프로필 체크
  const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single()

  const hasProfile = !!profile

  if (!hasProfile) {
    // 프로필 미설정 시 setup 페이지만 허용
    if (!isProfileSetupRoute && !isPublicRoute) {
      return NextResponse.redirect(new URL('/auth/onboarding', request.url))
    }
    return supabaseResponse
  }

  // 4. 모든 조건 충족 - 로그인 페이지 접근 시 메인으로
  if (isPublicRoute || isAuthRoute || isProfileSetupRoute) {
    return NextResponse.redirect(new URL('/map', request.url))
  }

  return supabaseResponse
}
