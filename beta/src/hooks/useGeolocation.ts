'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type PermissionState = 'unknown' | 'granted' | 'prompt' | 'denied'
export type Loc = {
  lat: number
  lng: number
  accuracy?: number
  heading?: number | null
  speed?: number | null
  timestamp: number
}

const geoOpts: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 3000,
  timeout: 15000,
}

export function useGeolocation() {
  const [permission, setPermission] = useState<PermissionState>('unknown')
  const [loc, setLoc] = useState<Loc | null>(null)
  const [error, setError] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)

  // 초기 권한 상태 질의
  useEffect(() => {
    let mounted = true
    if ('permissions' in navigator && (navigator as any).permissions?.query) {
      ;(navigator as any).permissions
        .query({ name: 'geolocation' })
        .then((r: any) => mounted && setPermission(r.state as PermissionState))
        .catch(() => mounted && setPermission('unknown'))
    } else {
      setPermission('unknown')
    }
    return () => {
      mounted = false
    }
  }, [])

  const handlePosition = useCallback((pos: GeolocationPosition) => {
    const { latitude, longitude, accuracy, heading, speed } = pos.coords
    setLoc({
      lat: latitude,
      lng: longitude,
      accuracy,
      heading,
      speed,
      timestamp: pos.timestamp,
    })
    setPermission('granted')
  }, [])

  const handleError = useCallback((err: GeolocationPositionError) => {
    if (err.code === err.PERMISSION_DENIED) setPermission('denied')
    setError(err.message || '위치 정보를 가져오지 못했어요.')
  }, [])

  // getCurrentPosition으로 권한 요청 (Safari 호환 — watchPosition보다 안정적)
  // 반드시 사용자 제스처(클릭/탭) 안에서 호출해야 네이티브 팝업이 표시됨
  const requestPermission = useCallback(() => {
    if (!navigator.geolocation) {
      setError('이 브라우저는 위치 기능을 지원하지 않습니다.')
      return
    }
    setError(null)
    navigator.geolocation.getCurrentPosition(handlePosition, handleError, geoOpts)
  }, [handlePosition, handleError])

  // 연속 위치 추적 시작 (이미 권한이 허용된 상태에서만 사용)
  const startWatch = useCallback(() => {
    if (!navigator.geolocation) {
      setError('이 브라우저는 위치 기능을 지원하지 않습니다.')
      return
    }

    // 기존 watch가 있으면 제거 (중복 방지)
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    setError(null)
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      geoOpts,
    )
  }, [handlePosition, handleError])

  const stopWatch = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  return { permission, loc, error, requestPermission, startWatch, stopWatch }
}
