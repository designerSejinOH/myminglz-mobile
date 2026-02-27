'use client'

export const dynamic = 'force-dynamic'

export default function NotFound() {
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
        <span style={{ fontSize: '4rem', fontWeight: 700, color: 'white' }}>404</span>
        <span style={{ fontSize: '1rem', marginTop: '0.5rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
          페이지를 찾을 수 없습니다.
        </span>
        <a
          href='/'
          style={{
            marginTop: '1.5rem',
            height: '3rem',
            padding: '0 2rem',
            background: '#CCFF00',
            borderRadius: '9999px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            textDecoration: 'none',
            fontWeight: 600,
            color: 'black',
          }}
        >
          홈으로 돌아가기
        </a>
      </body>
    </html>
  )
}
