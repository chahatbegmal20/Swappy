import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { postSchema } from '@/lib/validations/post'
import { generateSlug } from '@/lib/utils'

// GET /api/posts - List posts with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const authorId = searchParams.get('authorId')
    const sort = searchParams.get('sort') || 'recent'
    
    const skip = (page - 1) * limit
    
    // Build where clause
    const where: any = {
      status: 'PUBLISHED',
    }
    
    if (category) {
      where.category = { slug: category }
    }
    
    if (type) {
      where.type = type
    }
    
    if (authorId) {
      where.authorId = authorId
    }
    
    // Build orderBy clause
    let orderBy: any = {}
    switch (sort) {
      case 'trending':
        orderBy = { likesCount: 'desc' }
        break
      case 'popular':
        orderBy = { viewsCount: 'desc' }
        break
      case 'recent':
      default:
        orderBy = { publishedAt: 'desc' }
        break
    }
    
    // Fetch posts
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              role: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
            },
          },
          tags: {
            select: {
              id: true,
              name: true,
              slug: true,
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
      }),
      prisma.post.count({ where }),
    ])
    
    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get posts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

// POST /api/posts - Create a new post
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
    
    const body = await req.json()
    
    // Validate input
    const validatedData = postSchema.parse(body)
    
    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: validatedData.categoryId },
    })
    
    if (!category) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      )
    }
    
    // Create or connect tags
    const tagOperations = await Promise.all(
      validatedData.tags.map(async (tagName) => {
        const slug = tagName.toLowerCase().replace(/\s+/g, '-')
        
        const tag = await prisma.tag.upsert({
          where: { slug },
          create: {
            name: tagName,
            slug,
            usageCount: 1,
          },
          update: {
            usageCount: { increment: 1 },
          },
        })
        
        return { id: tag.id }
      })
    )
    
    // Create post
    const post = await prisma.post.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        type: validatedData.type,
        imageUrl: validatedData.imageUrl,
        imageKey: validatedData.imageKey,
        categoryId: validatedData.categoryId,
        toolsUsed: validatedData.toolsUsed,
        location: validatedData.location,
        isNSFW: validatedData.isNSFW,
        allowComments: validatedData.allowComments,
        slug: '',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        authorId: session.user.id,
        tags: {
          connect: tagOperations,
        },
      },
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
    
    // Update slug with post ID
    const slug = generateSlug(validatedData.title, post.id)
    const updatedPost = await prisma.post.update({
      where: { id: post.id },
      data: { slug },
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
    
    // Update user post count
    await prisma.user.update({
      where: { id: session.user.id },
      data: { postsCount: { increment: 1 } },
    })
    
    return NextResponse.json(updatedPost, { status: 201 })
  } catch (error: any) {
    console.error('Create post error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}

