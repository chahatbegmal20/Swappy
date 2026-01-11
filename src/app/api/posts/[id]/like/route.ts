import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST /api/posts/[id]/like - Like a post
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
    
    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: params.id,
        },
      },
    })
    
    if (existingLike) {
      return NextResponse.json(
        { error: 'Post already liked' },
        { status: 400 }
      )
    }
    
    // Create like and update counts
    await prisma.$transaction([
      prisma.like.create({
        data: {
          userId: session.user.id,
          postId: params.id,
        },
      }),
      prisma.post.update({
        where: { id: params.id },
        data: { likesCount: { increment: 1 } },
      }),
      prisma.user.update({
        where: { id: post.authorId },
        data: { totalLikes: { increment: 1 } },
      }),
    ])
    
    return NextResponse.json({ message: 'Post liked successfully' })
  } catch (error) {
    console.error('Like post error:', error)
    return NextResponse.json(
      { error: 'Failed to like post' },
      { status: 500 }
    )
  }
}

// DELETE /api/posts/[id]/like - Unlike a post
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
    
    // Check if like exists
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: params.id,
        },
      },
    })
    
    if (!existingLike) {
      return NextResponse.json(
        { error: 'Post not liked' },
        { status: 400 }
      )
    }
    
    // Delete like and update counts
    await prisma.$transaction([
      prisma.like.delete({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId: params.id,
          },
        },
      }),
      prisma.post.update({
        where: { id: params.id },
        data: { likesCount: { decrement: 1 } },
      }),
      prisma.user.update({
        where: { id: post.authorId },
        data: { totalLikes: { decrement: 1 } },
      }),
    ])
    
    return NextResponse.json({ message: 'Post unliked successfully' })
  } catch (error) {
    console.error('Unlike post error:', error)
    return NextResponse.json(
      { error: 'Failed to unlike post' },
      { status: 500 }
    )
  }
}

