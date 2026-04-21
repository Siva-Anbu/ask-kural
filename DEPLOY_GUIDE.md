# திருக்குறள் அருளுரை — Deployment Guide
## From your laptop to a live website on Vercel

---

## What's already done ✅

- Supabase table `kurals` created with 81 key Kurals loaded
- All project files built and ready
- Supabase URL and anon key pre-filled in `.env.local`

---

## Step 1 — Get your Anthropic API key

1. Go to **https://console.anthropic.com**
2. Sign in (or create a free account)
3. Click **API Keys** → **Create Key**
4. Copy the key — it looks like `sk-ant-...`
5. Open the file `.env.local` in the project folder
6. Replace `your_anthropic_api_key_here` with your actual key

---

## Step 2 — Set up the project on your computer

Open a terminal (PowerShell or CMD on Windows) and run:

```bash
# Go into the project folder
cd thirukkural-app

# Install all dependencies
npm install

# Test it locally first
npm run dev
```

Then open **http://localhost:3000** in your browser.
You should see the dark temple UI. Type something and test it!

---

## Step 3 — Push to GitHub

```bash
# Initialise git
git init

# Add all files (note: .env.local is in .gitignore — safe!)
git add .
git commit -m "Initial commit — Thirukkural Wisdom app"

# Create a new repo on github.com called "thirukkural-wisdom"
# Then connect and push:
git remote add origin https://github.com/YOUR_USERNAME/thirukkural-wisdom.git
git branch -M main
git push -u origin main
```

---

## Step 4 — Deploy on Vercel

1. Go to **https://vercel.com** and sign in with GitHub
2. Click **Add New Project**
3. Select your `thirukkural-wisdom` repository
4. Vercel auto-detects Next.js — no config needed
5. Before clicking Deploy, go to **Environment Variables** and add:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://pvoomzexavsgbhtmclbk.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` (the full key from .env.local) |
| `ANTHROPIC_API_KEY` | `sk-ant-...` (your Anthropic key) |

6. Click **Deploy** 🚀
7. In ~2 minutes your site is live at `https://thirukkural-wisdom.vercel.app`

---

## Step 5 — Optional: Custom domain

If you want `thirukkural.app` or similar:
1. Buy domain on **namecheap.com** (~$10/year)
2. In Vercel → Project → Settings → Domains → Add your domain
3. Follow Vercel's DNS instructions (takes ~10 minutes)

---

## Adding more Kurals

The database currently has 81 carefully chosen Kurals across key emotional themes.
To add more, just tell Claude:
> "Add the next 100 Kurals to my Supabase thirukkural table"

Claude can insert them directly since Supabase is connected here.

---

## File structure explained

```
thirukkural-app/
├── app/
│   ├── api/ask/route.ts    ← The brain: Kural matching + Claude API call
│   ├── page.tsx            ← The UI: what users see
│   ├── page.module.css     ← All the dark temple styling
│   ├── globals.css         ← Base styles + Tamil font
│   └── layout.tsx          ← HTML head, metadata, SEO
├── .env.local              ← Your secret keys (never goes to GitHub)
├── .gitignore              ← Keeps secrets safe
├── package.json            ← Project dependencies
├── next.config.js          ← Next.js settings
└── tsconfig.json           ← TypeScript settings
```

---

## Monthly cost estimate

| Users | Chats/day | Monthly cost |
|-------|-----------|-------------|
| 50 friends | 2 each | ~$3–5 |
| 500 users | 2 each | ~$30 |
| Personal use only | 5/day | < $1 |

Supabase: Free
Vercel: Free
Anthropic API: ~$0.003 per chat

---

Built with ❤️ for the Tamil diaspora · வாழ்க தமிழ்!
