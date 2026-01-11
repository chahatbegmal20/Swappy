import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST /api/posts/[id]/bookmark - Bookmark a post
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: params.id },
    })
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }
    
    // Check if already bookmarked
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: params.id,
        },
      },
    })
    
    if (existingBookmark) {
      return NextResponse.json(
        { error: 'Post already bookmarked' },
        { status: 400 }
      )
    }
    
    // Create bookmark and update count
    await prisma.$transaction([
      prisma.bookmark.create({
        data: {
          userId: session.user.id,
          postId: params.id,
        },
      }),
      prisma.post.update({
        where: { id: params.id },
        data: { bookmarksCount: { increment: 1 } },
      }),
    ])
    
    return NextResponse.json({ message: 'Post bookmarked successfully' })
  } catch (error) {
    console.error('Bookmark post error:', error)
    return NextResponse.json(
      { error: 'Failed to bookmark post' },
      { status: 500 }
    )
  }
}

// DELETE /api/posts/[id]/bookmark - Remove bookmark
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if bookmark exists
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: params.id,
        },
      },
    })
    
    if (!existingBookmark) {
      return NextResponse.json(
        { error: 'Post not bookmarked' },
        { status: 400 }
      )
    }
    
    // Delete bookmark and update count
    await prisma.$transaction([
      prisma.bookmark.delete({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId: params.id,
          },
        },
      }),
      prisma.post.update({
        where: { id: params.id },
        data: { bookmarksCount: { decrement: 1 } },
      }),
    ])
    
    return NextResponse.json({ message: 'Bookmark removed successfully' })
  } catch (error) {
    console.error('Remove bookmark error:', error)
    return NextResponse.json(
      { error: 'Failed to remove bookmark' },
      { status: 500 }
    )
  }
}

