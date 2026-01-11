# 📡 Atelier API Reference

Complete API documentation for the Atelier platform.

## Base URL
```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

All protected endpoints require authentication via NextAuth session cookies.

### Headers
```
Content-Type: application/json
Cookie: next-auth.session-token=<token>
```

---

## Authentication Endpoints

### Sign Up
Create a new user account.

```http
POST /api/auth/signup
```

**Request Body**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "name": "John Doe",
  "password": "SecurePass123"
}
```

**Response** `201 Created`
```json
{
  "message": "Account created successfully",
  "user": {
    "id": "cluuid123",
    "email": "user@example.com",
    "username": "johndoe",
    "name": "John Doe",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors**
- `400` - Invalid input or email/username already exists
- `500` - Server error

### Sign In
Handled by NextAuth.

```http
POST /api/auth/signin
```

Use NextAuth client methods:
```typescript
import { signIn } from 'next-auth/react'

// Email/password
await signIn('credentials', {
  email: 'user@example.com',
  password: 'password',
  callbackUrl: '/dashboard'
})

// Google OAuth
await signIn('google', { callbackUrl: '/dashboard' })
```

### Sign Out
```http
POST /api/auth/signout
```

Use NextAuth client method:
```typescript
import { signOut } from 'next-auth/react'
await signOut({ callbackUrl: '/' })
```

### Get Session
```http
GET /api/auth/session
```

**Response** `200 OK`
```json
{
  "user": {
    "id": "cluuid123",
    "email": "user@example.com",
    "name": "John Doe",
    "username": "johndoe",
    "role": "USER",
    "status": "ACTIVE"
  },
  "expires": "2024-02-01T00:00:00.000Z"
}
```

---

## Upload Endpoints

### Get Signed Upload URL
Request a signed URL for direct upload to R2.

```http
POST /api/upload/sign
```

**Authentication**: Required

**Request Body**
```json
{
  "fileName": "artwork.jpg",
  "fileType": "image/jpeg",
  "fileSize": 2048576
}
```

**Response** `200 OK`
```json
{
  "uploadUrl": "https://r2.cloudflare.com/bucket/...",
  "key": "uploads/user123/1234567890-abc123.jpg",
  "publicUrl": "https://pub-xxx.r2.dev/uploads/user123/1234567890-abc123.jpg"
}
```

**Errors**
- `401` - Unauthorized
- `400` - Invalid file type or size
- `500` - Failed to generate URL

**Supported File Types**
- `image/jpeg`
- `image/png`
- `image/webp`
- `image/gif`

**Size Limits**
- Images: 10 MB
- Videos: 100 MB (future)

---

## Post Endpoints

### List Posts
Get paginated list of posts with filters.

```http
GET /api/posts?page=1&limit=20&category=artwork&sort=trending
```

**Query Parameters**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| page | number | Page number | 1 |
| limit | number | Posts per page (max 100) | 20 |
| category | string | Filter by category slug | all |
| type | string | Filter by post type | all |
| authorId | string | Filter by author ID | - |
| sort | string | Sort: recent, trending, popular | recent |

**Response** `200 OK`
```json
{
  "posts": [
    {
      "id": "clpost123",
      "title": "Abstract Sunset",
      "description": "Digital painting...",
      "type": "ARTWORK",
      "status": "PUBLISHED",
      "imageUrl": "https://...",
      "slug": "abstract-sunset-post123",
      "isNSFW": false,
      "viewsCount": 1250,
      "likesCount": 89,
      "commentsCount": 12,
      "bookmarksCount": 34,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "publishedAt": "2024-01-01T00:00:00.000Z",
      "author": {
        "id": "cluser123",
        "username": "artist_pro",
        "name": "Artist Pro",
        "avatar": "https://...",
        "role": "CREATOR"
      },
      "category": {
        "id": "clcat123",
        "name": "Artwork",
        "slug": "artwork",
        "color": "#FF006E"
      },
      "tags": [
        { "id": "cltag1", "name": "abstract", "slug": "abstract" },
        { "id": "cltag2", "name": "digital", "slug": "digital" }
      ],
      "_count": {
        "likes": 89,
        "comments": 12,
        "bookmarks": 34
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

### Get Single Post
Get detailed post information.

```http
GET /api/posts/:id
```

**Response** `200 OK`
```json
{
  "id": "clpost123",
  "title": "Abstract Sunset",
  "description": "...",
  "imageUrl": "https://...",
  "author": { ... },
  "category": { ... },
  "tags": [ ... ],
  "comments": [
    {
      "id": "clcomment1",
      "content": "Amazing work!",
      "user": {
        "username": "fan123",
        "name": "Art Fan",
        "avatar": "https://..."
      },
      "replies": [...],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "isLiked": true,
  "isBookmarked": false,
  "_count": { ... }
}
```

**Errors**
- `404` - Post not found

### Create Post
Create a new post.

```http
POST /api/posts
```

**Authentication**: Required

**Request Body**
```json
{
  "title": "My Artwork",
  "description": "A beautiful piece...",
  "type": "ARTWORK",
  "categoryId": "clcat123",
  "tags": ["abstract", "digital", "colorful"],
  "imageUrl": "https://pub-xxx.r2.dev/uploads/...",
  "imageKey": "uploads/user123/...",
  "toolsUsed": "Photoshop, Procreate",
  "location": "New York, USA",
  "isNSFW": false,
  "allowComments": true
}
```

**Validation**
- `title`: 3-100 characters
- `description`: max 2000 characters
- `type`: ARTWORK | OUTFIT | TATTOO | BODY_ART
- `tags`: max 10 tags
- `toolsUsed`: max 200 characters
- `location`: max 100 characters

**Response** `201 Created`
```json
{
  "id": "clpost123",
  "title": "My Artwork",
  "slug": "my-artwork-post123",
  ...
}
```

**Errors**
- `401` - Unauthorized
- `400` - Invalid input or category
- `500` - Server error

### Update Post
Update an existing post (own posts only).

```http
PATCH /api/posts/:id
```

**Authentication**: Required (must be author or admin)

**Request Body** (all fields optional)
```json
{
  "title": "Updated Title",
  "description": "Updated description...",
  "tags": ["new", "tags"],
  "isNSFW": true
}
```

**Response** `200 OK`
```json
{
  "id": "clpost123",
  "title": "Updated Title",
  ...
}
```

**Errors**
- `401` - Unauthorized
- `403` - Not the post owner
- `404` - Post not found

### Delete Post
Delete a post (own posts only).

```http
DELETE /api/posts/:id
```

**Authentication**: Required (must be author or admin)

**Response** `200 OK`
```json
{
  "message": "Post deleted successfully"
}
```

**Errors**
- `401` - Unauthorized
- `403` - Not the post owner
- `404` - Post not found

---

## Engagement Endpoints

### Like Post
```http
POST /api/posts/:id/like
```

**Authentication**: Required

**Response** `200 OK`
```json
{
  "message": "Post liked successfully"
}
```

**Errors**
- `401` - Unauthorized
- `404` - Post not found
- `400` - Already liked

### Unlike Post
```http
DELETE /api/posts/:id/like
```

**Authentication**: Required

**Response** `200 OK`
```json
{
  "message": "Post unliked successfully"
}
```

### Bookmark Post
```http
POST /api/posts/:id/bookmark
```

**Authentication**: Required

**Response** `200 OK`
```json
{
  "message": "Post bookmarked successfully"
}
```

### Remove Bookmark
```http
DELETE /api/posts/:id/bookmark
```

**Authentication**: Required

**Response** `200 OK`
```json
{
  "message": "Bookmark removed successfully"
}
```

### Add Comment
```http
POST /api/posts/:id/comments
```

**Authentication**: Required

**Request Body**
```json
{
  "content": "Great work!",
  "parentId": "clcomment123" // Optional, for replies
}
```

**Response** `201 Created`
```json
{
  "id": "clcomment456",
  "content": "Great work!",
  "user": { ... },
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

## User Endpoints

### Get User Profile
```http
GET /api/users/:username
```

**Response** `200 OK`
```json
{
  "id": "cluser123",
  "username": "artist_pro",
  "name": "Artist Pro",
  "bio": "Professional digital artist",
  "avatar": "https://...",
  "coverImage": "https://...",
  "website": "https://...",
  "location": "New York, USA",
  "role": "CREATOR",
  "followersCount": 1250,
  "followingCount": 350,
  "postsCount": 89,
  "totalLikes": 15420,
  "totalViews": 125000,
  "createdAt": "2023-01-01T00:00:00.000Z"
}
```

### Update Profile
```http
PATCH /api/users/me
```

**Authentication**: Required

**Request Body** (all optional)
```json
{
  "name": "New Name",
  "bio": "Updated bio...",
  "website": "https://mysite.com",
  "location": "Los Angeles, USA"
}
```

**Response** `200 OK`
```json
{
  "id": "cluser123",
  "username": "artist_pro",
  ...
}
```

### Get User Posts
```http
GET /api/users/:username/posts?page=1&limit=20
```

**Response**: Same as List Posts

---

## Moderation Endpoints (Admin Only)

### Get Reports
```http
GET /api/admin/reports?status=pending
```

**Authentication**: Admin required

**Query Parameters**
- `status`: PENDING | UNDER_REVIEW | RESOLVED | DISMISSED

**Response** `200 OK`
```json
{
  "reports": [
    {
      "id": "clreport1",
      "reason": "INAPPROPRIATE_CONTENT",
      "description": "Contains explicit content",
      "status": "PENDING",
      "reporter": { ... },
      "post": { ... },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Update Report
```http
PATCH /api/admin/reports/:id
```

**Authentication**: Admin required

**Request Body**
```json
{
  "status": "RESOLVED",
  "resolution": "Content removed"
}
```

### Suspend User
```http
POST /api/admin/users/:id/suspend
```

**Authentication**: Admin required

**Request Body**
```json
{
  "reason": "Terms of service violation"
}
```

---

## Error Responses

All endpoints may return these standard errors:

**400 Bad Request**
```json
{
  "error": "Invalid input",
  "details": [...]
}
```

**401 Unauthorized**
```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden**
```json
{
  "error": "Forbidden"
}
```

**404 Not Found**
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "An error occurred"
}
```

---

## Rate Limiting

(Optional, if Upstash Redis is configured)

- **Default**: 100 requests per 15 minutes per IP
- **Authenticated**: 200 requests per 15 minutes per user
- **Upload**: 10 uploads per hour per user

Headers included in response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Webhooks (Future)

Coming soon: Webhooks for real-time events.

---

## SDK Examples

### JavaScript/TypeScript

```typescript
// Sign up
const response = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    username: 'johndoe',
    name: 'John Doe',
    password: 'SecurePass123'
  })
})

// Upload image
const { uploadUrl, key, publicUrl } = await fetch('/api/upload/sign', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size
  })
}).then(res => res.json())

await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': file.type }
})

// Create post
await fetch('/api/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'My Artwork',
    imageUrl: publicUrl,
    imageKey: key,
    ...
  })
})
```

---

## Testing

Use tools like:
- **Postman**: [Collection available](#)
- **Thunder Client**: VSCode extension
- **curl**: Command line

---

## Support

For API support:
- Documentation: https://docs.atelier.com
- Issues: https://github.com/your-repo/issues
- Email: api@atelier.com

