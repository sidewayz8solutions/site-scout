# Site Scout

Find local businesses without websites, auto-build them a demo site, and send outreach emails offering your web services.

## Features

- **Business Search** — Search any industry + city combo to discover local businesses
- **Website Detection** — Instantly identifies which businesses have websites and which don't
- **Auto Demo Site Builder** — One-click generation of a beautiful, industry-specific one-page demo website
- **Email Outreach** — Compose and send emails directly from the app with a pre-written template including the demo link
- **Outreach Tracking** — SQLite database tracks all businesses, generated sites, and emails sent

## Tech Stack

- Next.js 15 (App Router)
- TypeScript + Tailwind CSS
- shadcn/ui + Sonner toasts
- SQLite + Drizzle ORM
- Nodemailer (SMTP email sending)

## Getting Started

```bash
cd site-scout
npm install
npm run db:push
npm run dev
```

Open http://localhost:3001

## SMTP Configuration (for sending real emails)

Create a `.env.local` file:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com
```

If SMTP is not configured, the app will save the outreach record but show "SMTP not configured".

## How It Works

1. Enter an industry (e.g. `roofing`) and location (e.g. `Tampa, FL`)
2. The app generates 20 realistic mock local businesses for that query
3. Filter by "No Website" to see prospects missing an online presence
4. Click **Build Demo Site** to instantly generate a custom landing page
5. Click **Send Email** to open the composer with a pre-filled template
6. The email includes the demo site link and a service offering pitch

## Project Structure

```
site-scout/
├── app/
│   ├── page.tsx                 # Landing / search input
│   ├── search/
│   │   ├── page.tsx             # Search results wrapper
│   │   └── SearchPageContent.tsx # Main results UI
│   └── api/
│       ├── search/route.ts      # Mock business search API
│       ├── build-site/route.ts  # Demo site generator API
│       └── send-email/route.ts  # Email sending API
├── components/ui/               # shadcn components
├── db/
│   ├── schema.ts                # Drizzle schema
│   └── index.ts                 # DB connection
├── lib/
│   ├── mock-search.ts           # Mock business generator
│   ├── site-generator.ts        # HTML site builder
│   ├── email.ts                 # Nodemailer sender (server-only)
│   └── email-template.ts        # Default email template
└── public/generated-sites/      # Generated demo sites
```

## License

MIT
