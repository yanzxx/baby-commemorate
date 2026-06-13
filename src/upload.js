/**
 * 统一上传服务
 * 通过后端 API 将文件上传到七牛云
 */
const API = 'http://localhost:8080/api/upload'

/**
 * 上传文件到七牛云（通过后端）
 * @param {File} file - 文件对象
 * @param {string} type - 文件类型：photo / audio / video
 * @returns {Promise<string|null>} 文件 URL，失败返回 null
 */
export async function uploadFile(file, type = 'photo') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)

  try {
    const res = await fetch(API, {
      method: 'POST',
      body: formData,
    })
    const json = await res.json()
    if (json.success) {
      console.log(`[上传成功] ${type}: ${json.data.url}`)
      return json.data.url
    }
    console.warn('[上传失败]', json.message)
    return null
  } catch (e) {
    console.warn('[上传异常]', e.message)
    return null
  }
}

/**
 * 上传照片
 */
export async function uploadPhoto(file) {
  return uploadFile(file, 'photo')
}

/**
 * 上传音频
 */
export async function uploadAudio(file) {
  return uploadFile(file, 'audio')
}

/**
 * 上传视频
 */
export async function uploadVideo(file) {
  return uploadFile(file, 'video')
}
