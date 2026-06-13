/**
 * 本地生成七牛云上传 Token
 * 
 * 使用方式：
 *   1. 打开 https://portal.qiniu.com/user/key 获取 AK / SK
 *   2. 打开 https://portal.qiniu.com/kodo/bucket 创建存储空间，获取 bucket 名称
 *   3. 执行: node gen-token.js YOUR_AK YOUR_SK YOUR_BUCKET
 *   4. 输出结果粘贴到 src/qiniu.js 的 getUploadToken 中
 */

const crypto = require('crypto')

const ak = process.argv[2]
const sk = process.argv[3]
const bucket = process.argv[4]

if (!ak || !sk || !bucket) {
  console.log('用法: node gen-token.js <AccessKey> <SecretKey> <Bucket名称>')
  console.log('示例: node gen-token.js 12345abcdef 67890ghijkl my-baby-memorial')
  process.exit(1)
}

// 构建上传策略
const putPolicy = JSON.stringify({
  scope: bucket,
  deadline: Math.floor(Date.now() / 1000) + 3600, // 1小时有效
})

// Base64 URL-safe 编码
function urlsafeBase64(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

const encodedPutPolicy = urlsafeBase64(putPolicy)

// HMAC-SHA1 签名
const sign = crypto.createHmac('sha1', sk).update(encodedPutPolicy).digest('base64')
const encodedSign = urlsafeBase64(sign)

const token = ak + ':' + encodedSign + ':' + encodedPutPolicy

console.log('')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('上传 Token 生成成功！')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')
console.log('请在 src/qiniu.js 中配置：')
console.log('')
console.log('  token: "' + token + '"')
console.log('  domain: "https://你的域名.com"')
console.log('')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('⚠️ Token 1小时有效，过期重新执行此脚本')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
