'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CircleF, MarkerF, useGoogleMap } from '@react-google-maps/api'
import { useGeolocation } from '@/hooks/useGeolocation'
import { NavBarHeight } from '@/constants/sizeguide'
import { AnimatePresence, motion } from 'framer-motion'

type Tracking = false | 'observe' | 'follow'

export default function LiveLocationLayer() {
  const map = useGoogleMap()
  const { permission, loc, error, requestPermission, startWatch, stopWatch } = useGeolocation()
  const [tracking, setTracking] = useState<Tracking>('follow') // 기본값: follow
  const panLock = useRef(false) // 과도한 panTo 방지(간단 스로틀)

  // 지도 드래그하면 follow 해제
  useEffect(() => {
    if (!map) return
    const onDragStart = () => setTracking('observe')
    map.addListener('dragstart', onDragStart)
    return () => google.maps.event.clearListeners(map, 'dragstart')
  }, [map])

  // 이미 권한이 허용된 경우에만 자동 시작
  // prompt/unknown 상태에서는 사용자 제스처(버튼 클릭) 뒤에 요청해야
  // 모바일 브라우저(특히 iOS Safari)에서 네이티브 권한 팝업이 정상적으로 표시됨
  useEffect(() => {
    if (permission === 'granted') {
      startWatch()
      return () => stopWatch()
    }
  }, [permission, startWatch, stopWatch])

  // 컴포넌트 언마운트 시 watch 정리
  useEffect(() => {
    return () => stopWatch()
  }, [stopWatch])

  // 사용자 제스처로 위치 권한 요청 (getCurrentPosition 사용 — Safari 호환)
  const handleRequestPermission = useCallback(() => {
    requestPermission()
  }, [requestPermission])

  // follow일 때 카메라가 사용자 따라감 (간단 스로틀)
  useEffect(() => {
    if (!map || !loc || tracking !== 'follow') return
    if (panLock.current) return
    panLock.current = true
    map.panTo({ lat: loc.lat, lng: loc.lng })
    const t = setTimeout(() => {
      panLock.current = false
    }, 300) // 300ms 스로틀
    return () => clearTimeout(t)
  }, [map, loc, tracking])

  // 정확도 원 옵션
  const accuracyOpts = useMemo<google.maps.CircleOptions>(() => {
    return {
      radius: 10, // 실제 반경은 radius prop으로 지정
      strokeOpacity: 0.2,
      strokeWeight: 1,
      fillOpacity: 0.1,
      clickable: false,
      draggable: false,
      editable: false,
    }
  }, [])

  return (
    <>
      {/* 권한/에러 안내: 필요 시 UI로 치장 */}
      <AnimatePresence>
        {((!loc && (permission === 'prompt' || permission === 'unknown')) || permission === 'denied' || error) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              transformOrigin: 'center',
            }}
            className='absolute left-1/2 -translate-x-1/2 bottom-2 z-[1] bg-white/70 backdrop-blur-md rounded-lg overflow-hidden font-medium text-red-400 px-3 py-2 w-fit text-sm shadow'
          >
            {!loc && (permission === 'prompt' || permission === 'unknown') && (
              <button onClick={handleRequestPermission} className='underline active:opacity-60'>
                탭하여 위치 권한을 허용해 주세요.
              </button>
            )}
            {permission === 'denied' && (
              <div className=''>위치 접근이 거부되었습니다. 브라우저 설정에서 허용해 주세요.</div>
            )}
            {error && <div className=''>{error}</div>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 현재 위치 & 정확도 */}
      {loc && (
        <>
          {typeof loc.accuracy === 'number' && loc.accuracy > 0 && (
            <CircleF
              center={{ lat: loc.lat, lng: loc.lng }}
              radius={Math.max(5, loc.accuracy)} // 최소 반경 5m
              options={accuracyOpts}
            />
          )}
          <MarkerF
            position={{ lat: loc.lat, lng: loc.lng }}
            // 기본 파랑 점 아이콘을 쓰고 싶으면 options에 icon 지정 가능
          />
        </>
      )}

      {/* 오른쪽 하단 컨트롤 버튼들 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        style={{
          bottom: `${NavBarHeight + 16}px`,
        }}
        className='absolute right-3 z-[1] grid gap-2'
      >
        <button
          onClick={() => {
            if (!loc || !map) return
            setTracking('follow')
            map.panTo({ lat: loc.lat, lng: loc.lng })
          }}
          className='rounded-md bg-black px-3 py-2 text-sm shadow'
        >
          현재 위치로
        </button>
        <button
          onClick={() => setTracking((t) => (t === 'follow' ? 'observe' : 'follow'))}
          className='rounded-md bg-black px-3 py-2 text-sm shadow'
        >
          {tracking === 'follow' ? '따라가기 끄기' : '따라가기 켜기'}
        </button>
      </motion.div>
    </>
  )
}
