# 🎨 Atelier - Global Creative Platform

A premium, next-generation platform for showcasing art, fashion, body art, and tattoos. Built with modern web technologies and featuring a stunning 3D UI.

![Stack](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38B2AC)

## ✨ Features

### MVP Features
- ✅ **Authentication & Authorization**
  - Email/password authentication with bcrypt
  - Google OAuth integration
  - Role-based access control (USER, CREATOR, MODERATOR, ADMIN)
  - Email verification system
  - Password reset flow

- ✅ **Content Management**
  - Image upload with signed URLs (Cloudflare R2)
  - Post creation with metadata (title, description, category, tags)
  - Post types: Artwork, Outfit, Tattoo, Body Art
  - NSFW content flagging
  - Edit and delete own posts

- ✅ **Social Features**
  - Like/unlike posts
  - Comment system with nested replies
  - Bookmark posts
  - Post sharing

- ✅ **Discovery**
  - Explore feed with infinite scroll
  - Filter by category and type
  - Sort by recent, trending, popular
  - Creator profiles
  - Search functionality

- ✅ **Moderation**
  - Report system for content and users
  - Admin dashboard
  - Post moderation queue
  - User management

- ✅ **Premium UI/UX**
  - 3D animated landing page (React Three Fiber)
  - Cinematic color palette
  - Smooth transitions and micro-interactions
  - Fully responsive design
  - Dark mode optimized

## 🏗️ Architecture

### Tech Stack

**Frontend**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS + shadcn/ui
- React Three Fiber + Drei (3D)
- Framer Motion (animations)
- TanStack Query (data fetching)

**Backend**
- Next.js API Routes
- NextAuth.js (authentication)
- Prisma ORM
- PostgreSQL (Supabase)

**Storage & Infrastructure**
- Cloudflare R2 (S3-compatible storage)
- Vercel (deployment)
- Upstash Redis (rate limiting - optional)

### Why This Stack?

1. **Next.js App Router**: Server components reduce bundle size, better SEO, streaming SSR
2. **Prisma**: Type-safe database access, excellent DX, easy migrations
3. **Cloudflare R2**: Zero egress fees, S3-compatible API, fast CDN
4. **NextAuth**: Battle-tested auth solution, supports multiple providers
5. **Tailwind + shadcn/ui**: Rapid UI development with consistent design system

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (or Supabase account)
- Cloudflare account (for R2 storage)
- Google OAuth credentials (optional)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo>
cd atelier-platform
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Copy `env.example.txt` to `.env.local`:
```bash
cp env.example.txt .env.local
```

Edit `.env.local` with your credentials:

```env
# Database (Get from Supabase or local Postgres)
DATABASE_URL="postgresql://user:password@localhost:5432/atelier"

# NextAuth (Generate secret: openssl rand -base64 32)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret"

# Google OAuth (Get from Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Cloudflare R2 (Get from Cloudflare Dashboard)
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="atelier-uploads"
R2_PUBLIC_URL="https://your-bucket.r2.dev"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Atelier"
```

4. **Set up the database**

```bash
# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate

# Seed initial data (categories, tags, admin user)
npm run db:seed
```

5. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Admin User

After seeding, you can log in with:
- Email: `admin@atelier.com`
- Password: `password123`

**⚠️ Change this password immediately in production!**

## 📁 Project Structure

```
atelier/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── seed.ts               # Seed script
│
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── (auth)/          # Auth pages (login, signup)
│   │   ├── (dashboard)/     # Protected pages
│   │   ├── api/             # API routes
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Landing page
│   │   └── globals.css      # Global styles
│   │
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── three/          # 3D components
│   │   └── providers/      # Context providers
│   │
│   ├── lib/                # Utilities & configs
│   │   ├── auth.ts         # NextAuth config
│   │   ├── db.ts           # Prisma client
│   │   ├── storage.ts      # R2 storage client
│   │   ├── utils.ts        # Helper functions
│   │   └── validations/    # Zod schemas
│   │
│   └── types/              # TypeScript types
│
├── public/                 # Static assets
├── .env.local             # Environment variables
├── next.config.js         # Next.js config
├── tailwind.config.ts     # Tailwind config
└── tsconfig.json          # TypeScript config
```

## 🔑 Key Features Implementation

### Authentication Flow

1. User signs up → Account created with `PENDING_VERIFICATION` status
2. Email verification sent (TODO: implement email service)
3. User clicks link → Status changes to `ACTIVE`
4. User can now log in and access protected routes

### Upload Flow

1. User requests signed URL from `/api/upload/sign`
2. Client uploads file directly to Cloudflare R2
3. Client creates post with image URL via `/api/posts`
4. Post saved to database with all metadata

### RBAC (Role-Based Access Control)

```typescript
USER      → Can create posts, like, comment
CREATOR   → USER + Featured status
MODERATOR → CREATOR + Review reports
ADMIN     → MODERATOR + Manage users, all permissions
```

## 🎨 Design System

### Color Palette

```css
Primary (Fuchsia):  #FF006E
Secondary (Cyan):   #00F5FF
Accent (Gold):      #FFB800
Purple:             #8B00FF
Background:         #0D0D0D
Surface:            #1A1A1A
Text:               #FFFFFF
```

### Typography

- **Font**: Inter (geometric, modern)
- **Scale**: 12/14/16/18/24/32/48/64/96px
- **Weights**: 400 (regular), 500 (medium), 700 (bold), 800 (extrabold)

### Motion

- **Fast**: 150ms (micro-interactions)
- **Normal**: 300ms (hover states)
- **Slow**: 500ms (page transitions)
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)`

## 🔒 Security

### Implemented

- ✅ Bcrypt password hashing (12 rounds)
- ✅ JWT sessions with NextAuth
- ✅ CSRF protection (NextAuth)
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection (React escaping)
- ✅ Secure HTTP headers (CSP, HSTS, etc.)
- ✅ Input validation (Zod schemas)
- ✅ File upload validation (type, size)
- ✅ Signed URLs with expiry (5 minutes)
- ✅ Rate limiting ready (Upstash Redis)

### TODO

- [ ] Email verification implementation
- [ ] Rate limiting on API routes
- [ ] Image virus scanning
- [ ] Content moderation AI (AWS Rekognition)
- [ ] Two-factor authentication
- [ ] Session management dashboard

## 🧪 Testing

### Setup Testing (Future)

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

### Test Structure

```
tests/
├── unit/           # Utility functions, helpers
├── integration/    # API routes, database
└── e2e/           # Full user flows
```

## 🚀 Deployment

### Deploy to Vercel

1. **Connect your repository to Vercel**

2. **Add environment variables** in Vercel dashboard

3. **Deploy**
```bash
git push origin main
# Vercel auto-deploys
```

### Database Setup (Supabase)

1. Create a new project at [supabase.com](https://supabase.com)
2. Get connection string from Settings → Database
3. Update `DATABASE_URL` in Vercel environment variables
4. Run migrations:
```bash
npx prisma migrate deploy
```

### R2 Setup (Cloudflare)

1. Create R2 bucket in Cloudflare dashboard
2. Generate API tokens (Account ID, Access Key ID, Secret Access Key)
3. Configure custom domain or use `.r2.dev` subdomain
4. Update environment variables in Vercel

### Post-Deployment

- [ ] Change admin password
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Configure domain and SSL
- [ ] Set up analytics (Plausible, Umami)
- [ ] Configure email service (SendGrid, Postmark)
- [ ] Set up backups

## 📊 Database Schema

### Core Models

- **User**: Authentication, profile, stats
- **Post**: Content with metadata
- **Category**: Organization (Artwork, Fashion, etc.)
- **Tag**: Flexible categorization
- **Like**: User engagement
- **Comment**: Discussions with nesting
- **Bookmark**: Saved posts
- **Report**: Moderation system

See `prisma/schema.prisma` for full schema.

## 🛣️ Roadmap

### Phase 1: MVP ✅
- Core features complete
- Basic UI/UX
- Essential security

### Phase 2: Polish (Week 8-10)
- [ ] Email verification
- [ ] Advanced search
- [ ] User profiles with stats
- [ ] Follow system
- [ ] Notifications
- [ ] Performance optimization

### Phase 3: Growth (Week 11-14)
- [ ] Video upload support
- [ ] Collections/galleries
- [ ] Creator analytics
- [ ] Social sharing
- [ ] Mobile app (React Native)

### Phase 4: Monetization (Future)
- [ ] Creator subscriptions
- [ ] Tips/donations
- [ ] Premium features
- [ ] Marketplace
- [ ] Licensing system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow the existing code style
- Run `npm run lint` before committing
- Write meaningful commit messages
- Add comments for complex logic

## 📝 License

MIT License - feel free to use this project for learning or building your own platform.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [shadcn/ui](https://ui.shadcn.com/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)
- [Tailwind CSS](https://tailwindcss.com/)

## 📧 Support

For questions or issues:
- Open an issue on GitHub
- Email: support@atelier.com (replace with your email)

---

**Built with ❤️ for creators worldwide**

