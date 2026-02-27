// lib/uploadProfileImage.ts
import { createClient } from '@/lib/supabase'
import imageCompression from 'browser-image-compression'

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 512,
  useWebWorker: true,
  fileType: 'image/webp',
}

function uploadWithProgress(
  url: string,
  file: File,
  headers: Record<string, string>,
  onProgress: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      // 200, 201 모두 성공으로 처리 (upsert는 200 반환)
      if (xhr.status === 200 || xhr.status === 201) {
        resolve()
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Network error')))
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')))

    xhr.open('POST', url)
    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value)
    })

    const formData = new FormData()
    formData.append('', file) // Supabase Storage는 body에 파일 그대로
    xhr.send(file)
  })
}

export async function uploadProfileImage(
  file: File,
  profileId: string,
  onCompressProgress?: (progress: number) => void,
  onUploadProgress?: (progress: number) => void,
): Promise<string> {
  const supabase = createClient()

  // 1. 압축
  const compressedFile = await imageCompression(file, {
    ...COMPRESSION_OPTIONS,
    onProgress: onCompressProgress,
  })

  // 2. Supabase Storage 업로드 URL + 인증 헤더 구성
  const filePath = `${profileId}/avatar.webp`
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token

  if (!token) throw new Error('로그인이 필요해요.')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${encodeURIComponent('profile-images')}/${filePath}`

  // upsert를 위해 기존 파일 먼저 삭제 시도 (없어도 무시)
  await supabase.storage
    .from('profile-images')
    .remove([filePath])
    .catch(() => {})

  await uploadWithProgress(
    uploadUrl,
    compressedFile,
    {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'image/webp',
      'x-upsert': 'true',
    },
    onUploadProgress ?? (() => {}),
  )

  // 3. Public URL 획득
  const { data } = supabase.storage.from('profile-images').getPublicUrl(filePath)

  const publicUrl = `${data.publicUrl}?t=${Date.now()}`

  // 4. DB 업데이트
  const { error: dbError } = await supabase.from('profiles').update({ profile_image: publicUrl }).eq('id', profileId)

  // DB 업데이트 실패 시 업로드된 파일 삭제
  if (dbError) {
    await supabase.storage.from('profile-images').remove([filePath])
  }
  if (dbError) throw dbError

  return publicUrl
}

export async function deleteProfileImage(profileId: string): Promise<void> {
  const supabase = createClient()

  const filePath = `${profileId}/avatar.webp`

  // Storage에서 삭제
  const { error: storageError } = await supabase.storage.from('profile-images').remove([filePath])

  if (storageError) throw storageError

  // DB null로 업데이트
  const { error: dbError } = await supabase.from('profiles').update({ profile_image: null }).eq('id', profileId)

  if (dbError) throw dbError
}
