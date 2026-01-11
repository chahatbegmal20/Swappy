import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updatePostSchema } from '@/lib/validations/post'
import { deleteFile } from '@/lib/storage'

// GET /api/posts/[id] - Get a single post
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            role: true,
            totalLikes: true,
            followersCount: true,
          },
        },
        category: true,
        tags: true,
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
              },
            },
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    name: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            bookmarks: true,
          },
        },
      },
    })
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }
    
    // Increment view count
    await prisma.post.update({
      where: { id: params.id },
      data: { viewsCount: { increment: 1 } },
    })
    
    // Check if user has liked/bookmarked
    const session = await getServerSession(authOptions)
    let isLiked = false
    let isBookmarked = false
    
    if (session?.user) {
      const [like, bookmark] = await Promise.all([
        prisma.like.findUnique({
          where: {
            userId_postId: {
              userId: session.user.id,
              postId: params.id,
            },
          },
        }),
        prisma.bookmark.findUnique({
          where: {
            userId_postId: {
              userId: session.user.id,
              postId: params.id,
            },
          },
        }),
      ])
      
      isLiked = !!like
      isBookmarked = !!bookmark
    }
    
    return NextResponse.json({
      ...post,
      isLiked,
      isBookmarked,
    })
  } catch (error) {
    console.error('Get post error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

// PATCH /api/posts/[id] - Update a post
export async function PATCH(
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
    
    // Check if post exists and user owns it
    const existingPost = await prisma.post.findUnique({
      where: { id: params.id },
    })
    
    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }
    
    if (existingPost.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
    
    const body = await req.json()
    const validatedData = updatePostSchema.parse(body)
    
    // Update post
    const post = await prisma.post.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        category: true,
        tags: true,
      },
    })
    
    return NextResponse.json(post)
  } catch (error: any) {
    console.error('Update post error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    )
  }
}

// DELETE /api/posts/[id] - Delete a post
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
    
    // Check if post exists and user owns it
    const existingPost = await prisma.post.findUnique({
      where: { id: params.id },
    })
    
    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }
    
    if (existingPost.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
    
    // Delete from storage
    try {
      await deleteFile(existingPost.imageKey)
    } catch (error) {
      console.error('Failed to delete file from storage:', error)
      // Continue with post deletion even if storage deletion fails
    }
    
    // Delete post (cascades to comments, likes, bookmarks)
    await prisma.post.delete({
      where: { id: params.id },
    })
    
    // Update user post count
    await prisma.user.update({
      where: { id: existingPost.authorId },
      data: { postsCount: { decrement: 1 } },
    })
    
    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Delete post error:', error)
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}

