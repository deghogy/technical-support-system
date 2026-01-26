# Boccard-ID Technical Support System

A production-grade **Site Visit Request & Technical Support System** built with Next.js (App Router) and Supabase, featuring role-based access control, email notifications, and comprehensive documentation.

## 🚀 Quick Start

**New to this project?** Start here: [QUICK_START.md](QUICK_START.md) (5 minutes to overview, 30 minutes to running)

**Want to understand everything?** See [INDEX.md](INDEX.md) for navigation guide.

## ✨ What's Included

✅ **Production-Grade Security**
- Role-based access control (RBAC)
- Server-side input validation (Zod)
- Rate limiting (IP-based)
- CSRF protection system
- Structured logging with audit trail

✅ **Email Notifications**
- Admin notifications for new requests
- Customer confirmation for scheduled visits
- Visit completion notifications
- Test endpoint for verification

✅ **Complete Documentation**
- 30-minute setup guide
- Environment variable reference
- Technical implementation guide
- Email troubleshooting guide
- Visual implementation checklist

## 📚 Documentation Map

| Document | Time | Purpose |
|----------|------|---------|
| [QUICK_START.md](QUICK_START.md) | 5 min | Start here - full setup in 30 min |
| [INDEX.md](INDEX.md) | 5 min | Navigation guide for all docs |
| [ENV_SETUP.md](ENV_SETUP.md) | 10 min | Environment variable reference |
| [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) | 20 min | Technical deep-dive |
| [EMAIL_NOTIFICATION_GUIDE.md](EMAIL_NOTIFICATION_GUIDE.md) | 15 min | Email troubleshooting |
| [CHANGES_SUMMARY.md](CHANGES_SUMMARY.md) | 5 min | What changed overview |
| [DELIVERY_SUMMARY.md](DELIVERY_SUMMARY.md) | 5 min | Final implementation summary |

## 🔧 Installation

```bash
# Install dependencies
npm install

# Create .env.local with API keys
# See ENV_SETUP.md for template

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📋 System Architecture

```
Public User Flow:
  Request → Submit Form → Email Notification → Admin Dashboard

Admin Flow:
  View Requests → Approve & Schedule → Send Confirmation → Track Visit

Technician Flow:
  View Scheduled → Record Visit → Notify Customer → Complete

Customer Confirmation:
  Receive Email → Click Link → Confirm Visit → System Complete
```

## 🔐 Security Features

- **Role-Based Access Control** - Only admins can approve/record visits
- **Input Validation** - Zod schemas on all API routes
- **Rate Limiting** - 10 requests/min per IP on public endpoints
- **Structured Logging** - Full audit trail with Pino
- **CSRF Protection** - Token system implemented
- **Error Handling** - Safe error messages, no info leaks
- **Email Security** - Credentials in env vars only

## 📧 Email System

Uses **Resend API** for reliable email delivery:
- Admin notifications when new requests arrive
- Customer confirmations when visit scheduled
- Visit completion notifications

**Test email delivery:**
```bash
curl "http://localhost:3000/api/admin/notify-test?email=you@example.com"
```

## 🧪 Testing

### Test Email Delivery
```bash
curl "http://localhost:3000/api/admin/notify-test?email=test@example.com"
```

### Test Role Authorization
```bash
# Should return 403 Forbidden if not admin
curl -X POST http://localhost:3000/api/admin/approvals/test-id \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'
```

### Test Rate Limiting
```bash
# 11th request should return 429 Too Many Requests
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/request \
    -H "Content-Type: application/json" \
    -d '{"requester_name":"Test","requester_email":"test@test.com","site_location":"Loc","problem_desc":"Test problem description","requested_date":"2026-02-01","estimated_hours":2}'
done
```

## 📦 Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TailwindCSS
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Email:** Resend API
- **Validation:** Zod
- **Logging:** Pino
- **Deployment:** Vercel

## 🚀 Deployment

### To Vercel

1. Set environment variables in Vercel dashboard:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   RESEND_API_KEY (secret)
   NEXT_PUBLIC_BASE_URL
   ```

2. Push to main branch - auto-deploys!

See [QUICK_START.md](QUICK_START.md) for full deployment guide.

## 🛠️ Development

### Build for production
```bash
npm run build
npm start
```

### Check for errors
```bash
npm run lint
```

### Debug with detailed logging
```bash
LOG_LEVEL=debug npm run dev
```

## 📖 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Resend Email Docs](https://resend.com/docs)
- [Zod Validation](https://zod.dev)

## 🆘 Troubleshooting

### Emails not sending?
See [EMAIL_NOTIFICATION_GUIDE.md](EMAIL_NOTIFICATION_GUIDE.md)

### Setup issues?
See [QUICK_START.md](QUICK_START.md)

### Technical questions?
See [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)

### Can't find what you need?
Check [INDEX.md](INDEX.md) for navigation guide

## ✅ Status

- ✅ Production Ready
- ✅ All security measures implemented
- ✅ Comprehensive documentation
- ✅ Email system working
- ✅ Rate limiting active
- ✅ Full audit logging

## 📄 License

Part of Boccard-ID Technical Support System

---

**Ready to get started?** → [QUICK_START.md](QUICK_START.md)  
**Need to understand something?** → [INDEX.md](INDEX.md)  
**Have questions?** → Check the relevant documentation file above
This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# test from deghogy
