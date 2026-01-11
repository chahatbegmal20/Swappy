import { prisma } from '@/lib/db'
import Link from 'next/link'
import Image from 'next/image'
import { formatNumber } from '@/lib/utils'
import { Heart, MessageCircle, Bookmark } from 'lucide-react'

async function getPosts() {
  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
    },
    orderBy: {
      publishedAt: 'desc',
    },
    take: 20,
    include: {
      author: {
        select: {
          username: true,
          name: true,
          avatar: true,
        },
      },
      category: {
        select: {
          name: true,
          slug: true,
          color: true,
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

  return posts
}

export default async function ExplorePage() {
  const posts = await getPosts()

  return (
    <main className="min-h-screen bg-atelier-charcoal">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-atelier-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold gradient-text">
              Atelier
            </Link>
            
            <nav className="flex items-center gap-6">
              <Link href="/explore" className="text-white font-medium">
                Explore
              </Link>
              <Link href="/creators" className="text-gray-400 hover:text-white transition">
                Creators
              </Link>
              <Link href="/login" className="text-gray-400 hover:text-white transition">
                Login
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 border-b border-white/10">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Explore <span className="gradient-text">Creativity</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Discover amazing art, fashion, body art, and tattoos from creators around the world
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 border-b border-white/10 sticky top-[73px] z-30 bg-atelier-charcoal/80 backdrop-blur-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 overflow-x-auto">
            <button className="px-4 py-2 rounded-full bg-atelier-fuchsia text-white font-medium whitespace-nowrap">
              All
            </button>
            <button className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition whitespace-nowrap">
              Artwork
            </button>
            <button className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition whitespace-nowrap">
              Fashion
            </button>
            <button className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition whitespace-nowrap">
              Tattoos
            </button>
            <button className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition whitespace-nowrap">
              Body Art
            </button>
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-gray-400">No posts yet. Be the first to share!</p>
              <Link 
                href="/signup" 
                className="inline-block mt-4 px-6 py-3 bg-gradient-hero rounded-lg font-medium hover:opacity-90 transition"
              >
                Get Started
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="group block rounded-xl overflow-hidden bg-atelier-surface border border-white/10 hover:border-white/20 transition card-hover"
                >
                  {/* Image */}
                  <div className="aspect-square relative overflow-hidden bg-black">
                    <Image
                      src={post.imageUrl}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Category Badge */}
                    <div
                      className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm"
                      style={{
                        backgroundColor: `${post.category.color}20`,
                        borderColor: post.category.color,
                        borderWidth: '1px',
                        color: post.category.color,
                      }}
                    >
                      {post.category.name}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-atelier-fuchsia transition">
                      {post.title}
                    </h3>

                    {/* Author */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-hero flex items-center justify-center text-xs font-bold">
                        {post.author.name?.[0] || post.author.username[0]}
                      </div>
                      <span className="text-sm text-gray-400">
                        {post.author.name || post.author.username}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {formatNumber(post._count.likes)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {formatNumber(post._count.comments)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bookmark className="w-4 h-4" />
                        {formatNumber(post._count.bookmarks)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

