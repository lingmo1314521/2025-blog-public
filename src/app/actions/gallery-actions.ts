'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function shareToGallery(formData: FormData) {
  const file = formData.get('file') as File
  const title = formData.get('title') as string
  const asciiText = formData.get('asciiText') as string
  const width = parseInt(formData.get('width') as string)
  const height = parseInt(formData.get('height') as string)
  const processingTime = parseFloat(formData.get('processingTime') as string)

  if (!file) throw new Error('没有检测到图片文件')

  // 1. 上传图片到 Storage 桶 'gallery'
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('gallery')
    .upload(fileName, file)

  if (uploadError) {
    console.error('Storage Error:', uploadError)
    throw new Error('图片上传失败')
  }

  // 2. 获取公共 URL
  const { data: { publicUrl } } = supabase.storage
    .from('gallery')
    .getPublicUrl(fileName)

  // 3. 写入数据库记录
  const { error: dbError } = await supabase
    .from('gallery_items')
    .insert([{
      title: title || '未命名作品',
      image_url: publicUrl,
      ascii_text: asciiText,
      width,
      height,
      processing_time: processingTime
    }])

  if (dbError) {
    console.error('DB Error:', dbError)
    throw new Error('数据库保存失败')
  }

  // 4. 通知 Next.js 重新验证数据缓存
  revalidatePath('/')
  return { success: true }
}