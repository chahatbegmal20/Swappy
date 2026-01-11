import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateUploadSignature, validateUploadParams } from '@/lib/storage'
import { z } from 'zod'

const uploadRequestSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.string(),
  fileSize: z.number().positive(),
})

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Parse request
    const body = await req.json()
    const { fileName, fileType, fileSize } = uploadRequestSchema.parse(body)
    
    // Validate upload parameters
    const validation = validateUploadParams(fileName, fileType, fileSize)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }
    
    // Generate signed URL
    const signature = await generateUploadSignature(
      fileName,
      fileType,
      session.user.id
    )
    
    return NextResponse.json(signature)
  } catch (error: any) {
    console.error('Upload sign error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to generate upload signature' },
      { status: 500 }
    )
  }
}

