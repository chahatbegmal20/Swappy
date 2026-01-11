import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Initialize S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export interface UploadSignature {
  uploadUrl: string
  key: string
  publicUrl: string
}

/**
 * Generate a presigned URL for direct upload to R2
 */
export async function generateUploadSignature(
  fileName: string,
  fileType: string,
  userId: string
): Promise<UploadSignature> {
  // Generate unique key with user prefix
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = fileName.split('.').pop()
  const key = `uploads/${userId}/${timestamp}-${randomString}.${extension}`

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: fileType,
  })

  // Generate presigned URL valid for 5 minutes
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 })

  // Construct public URL
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

  return {
    uploadUrl,
    key,
    publicUrl,
  }
}

/**
 * Delete an object from R2
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  })

  await s3Client.send(command)
}

/**
 * Validate file upload parameters
 */
export function validateUploadParams(
  fileName: string,
  fileType: string,
  fileSize: number
): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

  if (!allowedTypes.includes(fileType)) {
    return {
      valid: false,
      error: 'Invalid file type. Allowed types: JPEG, PNG, WebP, GIF',
    }
  }

  if (fileSize > maxSize) {
    return {
      valid: false,
      error: 'File size exceeds 10MB limit',
    }
  }

  if (fileName.length > 255) {
    return {
      valid: false,
      error: 'File name too long',
    }
  }

  return { valid: true }
}

