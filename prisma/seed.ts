import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create categories
  const categories = [
    {
      name: 'Artwork',
      slug: 'artwork',
      description: 'Digital and traditional art, illustrations, paintings',
      icon: '🎨',
      color: '#FF006E',
      order: 1,
    },
    {
      name: 'Fashion & Outfits',
      slug: 'fashion',
      description: 'Fashion looks, styling, street style',
      icon: '👗',
      color: '#8B00FF',
      order: 2,
    },
    {
      name: 'Tattoos',
      slug: 'tattoos',
      description: 'Tattoo designs and healed work',
      icon: '🖊️',
      color: '#00F5FF',
      order: 3,
    },
    {
      name: 'Body Art',
      slug: 'body-art',
      description: 'Makeup, face paint, performance art',
      icon: '💄',
      color: '#FFB800',
      order: 4,
    },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    })
  }

  console.log('✅ Created categories')

  // Create sample tags
  const tags = [
    'abstract',
    'portrait',
    'landscape',
    'digital',
    'traditional',
    'minimalist',
    'colorful',
    'black-and-white',
    'streetwear',
    'vintage',
    'modern',
    'editorial',
    'casual',
    'luxury',
    'gothic',
    'geometric',
    'floral',
    'tribal',
    'realism',
    'watercolor',
  ]

  for (const tagName of tags) {
    const slug = tagName.toLowerCase().replace(/\s+/g, '-')
    await prisma.tag.upsert({
      where: { slug },
      update: { name: tagName },
      create: {
        name: tagName,
        slug,
        usageCount: 0,
      },
    })
  }

  console.log('✅ Created tags')

  // Create admin user (for testing)
  const adminEmail = 'admin@swappy.com'
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        username: 'admin',
        name: 'Admin User',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5QK3bJXUr9HF.', // password123
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: new Date(),
        bio: 'Platform administrator',
      },
    })

    console.log('✅ Created admin user (admin@swappy.com / password123)')
  }

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

