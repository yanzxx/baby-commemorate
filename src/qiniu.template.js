/**
 * 七牛云上传工具 - 模板文件
 * 
 * 使用方式：
 *   1. 复制此文件为 qiniu.js
 *   2. 执行 node gen-token.cjs <AK> <SK> <bucket>
 *   3. 将 token 和 domain 填入下方 CONFIG
 */

const CONFIG = {
  domain: 'https://你的域名.com',
  token: '由 gen-token.cjs 生成',
}

export async function uploadToQiniu(file, prefix = '') {
  if (!CONFIG.token || !CONFIG.domain) {
    console.warn('七牛云未配置，使用本地存储')
    return null
  }
  const key = prefix + Date.now() + '-' + encodeURIComponent(file.name)
  const { upload } = await import('qiniu-js')
  return new Promise((resolve, reject) => {
    const observable = upload(file, key, CONFIG.token, { useCdnDomain: true })
    observable.subscribe({
      error: (err) => { console.error('七牛上传失败:', err); reject(err) },
      complete: (res) => resolve(CONFIG.domain + '/' + res.key),
    })
  })
}

export async function uploadMedia(file, type) {
  try {
    const url = await uploadToQiniu(file, type + '/')
    if (url) return url
  } catch {}
  return null
}
