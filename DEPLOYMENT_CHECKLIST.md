# 🚀 Swappy Deployment Checklist

Use this checklist to ensure a smooth production deployment.

## Pre-Deployment

### Code Quality
- [ ] All linter warnings resolved (`npm run lint`)
- [ ] No console.log statements in production code
- [ ] Error boundaries implemented
- [ ] Loading states for all async operations
- [ ] Proper TypeScript types (no `any` types)

### Security
- [ ] All environment variables secured
- [ ] No secrets in code or Git history
- [ ] NEXTAUTH_SECRET is strong (32+ characters)
- [ ] Admin default password changed
- [ ] Database connection string uses SSL
- [ ] CORS configured properly for R2 bucket
- [ ] Rate limiting configured (if using Upstash)

### Database
- [ ] Migrations run successfully
- [ ] Database seeded with categories and tags
- [ ] Indexes verified on frequently queried fields
- [ ] Database backups configured
- [ ] Connection pooling enabled (Prisma/Supabase)

### Testing
- [ ] Authentication flow tested (signup, login, OAuth)
- [ ] Upload flow tested end-to-end
- [ ] Post creation/editing/deletion works
- [ ] Like/comment/bookmark functionality works
- [ ] Mobile responsiveness verified
- [ ] Cross-browser testing done (Chrome, Firefox, Safari)
- [ ] Performance audit run (Lighthouse)

### Assets & Media
- [ ] All images optimized
- [ ] Favicon added
- [ ] Open Graph images configured
- [ ] 3D models optimized (if any)
- [ ] Fonts loaded efficiently

### SEO & Meta
- [ ] Meta tags configured
- [ ] robots.txt created
- [ ] sitemap.xml generated
- [ ] Social media preview cards working
- [ ] Analytics integrated

## Deployment Steps

### 1. Environment Setup

#### Vercel
- [ ] Project connected to GitHub
- [ ] Environment variables added to Vercel
- [ ] Production database URL configured
- [ ] NEXTAUTH_URL updated to production domain
- [ ] Google OAuth redirect URI added for production
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`

#### Database (Supabase)
- [ ] Production database created
- [ ] Connection string copied to Vercel
- [ ] Migrations deployed: `npx prisma migrate deploy`
- [ ] Database seeded: `npm run db:seed`
- [ ] Backups configured (daily recommended)
- [ ] Connection pooling enabled

#### Storage (Cloudflare R2)
- [ ] Production bucket created
- [ ] CORS configured for production domain
- [ ] Public access enabled
- [ ] CDN custom domain configured (optional)
- [ ] API tokens generated and added to Vercel

#### OAuth (Google)
- [ ] Production redirect URI added:
  ```
  https://your-domain.com/api/auth/callback/google
  ```
- [ ] OAuth consent screen published (if ready)
- [ ] Test users added (if still in testing mode)

### 2. Deploy

- [ ] Push code to main branch
- [ ] Verify Vercel auto-deployment starts
- [ ] Monitor build logs for errors
- [ ] Wait for deployment to complete (~2-3 minutes)

### 3. Post-Deployment

#### Immediate Checks
- [ ] Site loads without errors
- [ ] Homepage displays correctly
- [ ] 3D scene loads (check different devices)
- [ ] Signup flow works
- [ ] Login flow works
- [ ] Google OAuth works
- [ ] Image upload works
- [ ] Post creation works
- [ ] Feed page loads posts
- [ ] Mobile view works

#### Security
- [ ] Change admin password immediately
- [ ] Test authentication flows
- [ ] Verify HTTPS is enforced
- [ ] Check security headers (use securityheaders.com)
- [ ] Verify no sensitive data in client-side code

#### Performance
- [ ] Run Lighthouse audit
  - Performance: > 90
  - Accessibility: > 90
  - Best Practices: > 90
  - SEO: > 90
- [ ] Test Time to First Byte (TTFB < 600ms)
- [ ] Check Core Web Vitals
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1
- [ ] Verify images are optimized (WebP format)
- [ ] Check bundle size (use bundle analyzer)

#### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure uptime monitoring (UptimeRobot)
- [ ] Set up analytics (Plausible/Umami)
- [ ] Configure log aggregation
- [ ] Set up alerts for errors/downtime

## Domain & DNS

- [ ] Custom domain purchased (optional)
- [ ] Domain added to Vercel
- [ ] DNS records configured
- [ ] SSL certificate issued (automatic)
- [ ] WWW redirect configured
- [ ] Domain propagation verified

## Email (If Implemented)

- [ ] Email service configured (SendGrid/Postmark)
- [ ] Email verification flow tested
- [ ] Password reset flow tested
- [ ] Welcome email template ready
- [ ] Email deliverability tested
- [ ] SPF/DKIM/DMARC configured

## Legal & Compliance

- [ ] Privacy Policy page created
- [ ] Terms of Service page created
- [ ] Cookie consent banner (if needed)
- [ ] GDPR compliance checked (if EU users)
- [ ] Age verification (if needed for content)

## Marketing & Launch

- [ ] Landing page copy finalized
- [ ] Social media accounts created
- [ ] Launch announcement prepared
- [ ] Press kit ready (if applicable)
- [ ] Community moderation plan in place
- [ ] Support email configured

## Maintenance Plan

### Daily
- [ ] Monitor error logs
- [ ] Check uptime status
- [ ] Review user feedback

### Weekly
- [ ] Review moderation queue
- [ ] Check performance metrics
- [ ] Update dependencies (security patches)
- [ ] Backup verification

### Monthly
- [ ] Performance audit
- [ ] Security audit
- [ ] User growth analysis
- [ ] Database optimization
- [ ] Cost analysis (hosting, storage)

## Rollback Plan

In case something goes wrong:

1. **Revert Deployment**
   ```bash
   # In Vercel dashboard
   Deployments → Previous Deployment → "Promote to Production"
   ```

2. **Database Rollback**
   ```bash
   # Restore from backup
   # Run previous migration
   npx prisma migrate resolve --rolled-back <migration-name>
   ```

3. **Clear CDN Cache** (if using)

4. **Notify Users** (if extended downtime)

## Emergency Contacts

- Database: Supabase support
- Hosting: Vercel support
- Storage: Cloudflare support
- Domain: Your registrar support

## Success Metrics

After 1 week, verify:
- [ ] Zero critical errors
- [ ] < 1% error rate
- [ ] 99.9%+ uptime
- [ ] User signups working
- [ ] Uploads working
- [ ] No performance degradation

## Optional Enhancements

- [ ] Redis caching layer
- [ ] Image CDN (Cloudinary/Imgix)
- [ ] Rate limiting on API routes
- [ ] Advanced analytics
- [ ] A/B testing framework
- [ ] Feature flags system
- [ ] Automated testing pipeline
- [ ] Staging environment

---

## Quick Commands

```bash
# Check build locally
npm run build
npm run start

# Database
npx prisma studio              # View database
npx prisma migrate deploy      # Deploy migrations
npx prisma db seed             # Seed database

# Vercel CLI
vercel                         # Deploy to preview
vercel --prod                  # Deploy to production
vercel logs                    # View logs
vercel env pull                # Pull environment variables
```

---

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for client errors
3. Check database connection in Prisma Studio
4. Verify all environment variables are set
5. Test API routes with Postman/Thunder Client

---

**Remember**: Always test in a staging environment before pushing to production!

🎉 **Good luck with your launch!**

