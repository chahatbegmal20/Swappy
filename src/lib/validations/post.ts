import { z } from 'zod'

export const postSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional(),
  type: z.enum(['ARTWORK', 'OUTFIT', 'TATTOO', 'BODY_ART']),
  categoryId: z.string().cuid('Invalid category'),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed'),
  toolsUsed: z.string().max(200, 'Tools used must be less than 200 characters').optional(),
  location: z.string().max(100, 'Location must be less than 100 characters').optional(),
  isNSFW: z.boolean().default(false),
  allowComments: z.boolean().default(true),
  imageUrl: z.string().url('Invalid image URL'),
  imageKey: z.string().min(1, 'Image key is required'),
})

export const updatePostSchema = postSchema.partial().omit({ imageUrl: true, imageKey: true })

export const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be less than 1000 characters'),
  postId: z.string().cuid('Invalid post ID'),
  parentId: z.string().cuid('Invalid parent comment ID').optional(),
})

export const reportSchema = z.object({
  reason: z.enum([
    'SPAM',
    'HARASSMENT',
    'INAPPROPRIATE_CONTENT',
    'COPYRIGHT_VIOLATION',
    'IMPERSONATION',
    'HATE_SPEECH',
    'VIOLENCE',
    'OTHER',
  ]),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  postId: z.string().cuid('Invalid post ID').optional(),
  reportedUserId: z.string().cuid('Invalid user ID').optional(),
})

export type CreatePostInput = z.infer<typeof postSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>
export type CreateCommentInput = z.infer<typeof commentSchema>
export type CreateReportInput = z.infer<typeof reportSchema>

