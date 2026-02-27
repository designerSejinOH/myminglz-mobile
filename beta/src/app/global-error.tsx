'use client'

export const dynamic = 'force-dynamic'

// global-error는 루트 레이아웃 전체를 대체하므로 <html>/<body>가 필수이며
// 앱 Provider 컨텍스트를 사용할 수 없어 Screen 등 컴포넌트를 사용할 수 없음
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang='ko'>
      <body
        style={{
          margin: 0,
          background: '#242424',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100dvh',
        }}
      >
        <div>
          <img src='/img/sample/profile.png' alt='logo' style={{ height: '6rem', width: 'auto' }} />
        </div>
        <span style={{ fontSize: '1rem', marginTop: '1rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
          문제가 발생했습니다.
        </span>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: 'rgba(255,255,255,0.15)', textAlign: 'center' }}>
          {error.message}
        </p>
        <button
          onClick={() => reset()}
          style={{
            width: '100%',
            maxWidth: '400px',
            height: '3.5rem',
            background: '#CCFF00',
            borderRadius: '9999px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '1rem',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          다시 시도하기
        </button>
      </body>
    </html>
  )
}
