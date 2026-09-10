# Jayden's Premier Construction LLC — Website

Plain HTML/CSS/JavaScript for the public site (no framework, no build
step). The `/admin` panel is a small serverless add-on (Vercel Functions +
KV + Blob) — see "Admin panel" below.

## Files

```
index.html      Page structure (all sections)
style.css       All styling and responsive rules
script.js       All interactive behavior (menu, form, sliders, lightbox)
data.js         Editable content: services, projects, testimonials, areas
                (projects/testimonials are overridden live by the admin
                panel once it's set up — see below)
config.js       Editable business info: phone, email, hours, SEO, form endpoint
assets/images/  Logo, favicon, hero poster/fallback images
assets/video/   Hero background video
robots.txt      Search engine crawl rules
sitemap.xml     Sitemap for search engines

admin/          The admin panel (login + dashboard) at /admin
api/            Serverless functions the admin panel and public site call
lib/auth.js     Shared login/session/password logic used by the api/ routes
package.json    Dependencies needed by api/ (@vercel/kv, @vercel/blob)
.env.example    Template of the environment variables the admin panel needs
```

## How to edit content (no code changes needed)

- **Contact info, business hours, social links, SEO text, form endpoint** → edit `config.js`.
- **Services, featured projects, testimonials, service areas** → edit `data.js`.
- **Hero video/images** → replace the files at `assets/video/hero-construction.mp4`, `assets/images/hero-poster.jpg`, and `assets/images/hero-fallback.jpg`, keeping the same filenames.

This structure is deliberately simple so it can later be swapped for a real admin dashboard (or a CMS) without changing `index.html`, `style.css`, or the rendering logic in `script.js` — only the source of `SITE_CONFIG`/`SERVICES`/etc. would change from these files to an API call.

## What still needs your real information

Everything below is currently a placeholder — replace before publishing:

| Placeholder | Where |
|---|---|
| `[ADD DOMAIN]` | `config.js`, `index.html` (canonical/OG tags, schema), `robots.txt`, `sitemap.xml` |
| `[ADD BUSINESS HOURS]` | `config.js` |
| `[ADD SOCIAL MEDIA LINK]` (Facebook, Instagram) | `config.js`, footer in `index.html` |
| `[ADD PRIVACY POLICY URL OR PAGE]` / `[ADD TERMS URL OR PAGE]` | `config.js` |
| `[ADD COMPANY DESCRIPTION]` | `data.js` → `ABOUT_TEXT` |
| `[ADD REAL CLIENT REVIEW]` and client names | `data.js` → `TESTIMONIALS` |
| Project names, service type, location, description, photos | `data.js` → `PROJECTS` |
| Before/after photos | `data.js` → `BEFORE_AFTER` |
| `[ADD FORMSPREE ENDPOINT]` | `config.js` → `formEndpoint` (see below) |
| `[ADD PUBLIC BUSINESS LOCATION OR MAP EMBED]` | `config.js` (only if you want a public address/map shown) |

**Not added because they weren't confirmed:** "Licensed & Insured" claims, years in business, number of employees, project counts, certifications, awards. Add these only once you confirm them — I did not invent any of this.

**About the hero video:** it's the roofing clip you provided, with audio removed and re-compressed for web (1.6MB, muted, loops). I still need you to confirm it's Jayden's Premier Construction's own work before this goes live publicly — the site is built so you can swap it for a different clip at any time by replacing `assets/video/hero-construction.mp4` (and `hero-poster.jpg` / `hero-fallback.jpg` if you want a different still frame).

## Connecting the estimate form (required for leads to reach you)

Right now, submitting the form shows an honest message that it isn't connected yet — no lead is silently lost or faked.

**Recommended: Formspree.** Reasoning: no backend to host or maintain, a free tier that covers a small business's lead volume, built-in file attachment support (needed for the photo upload), and it never exposes your email address in the page source (submissions route through Formspree's servers). Alternatives like SendGrid/Resend require writing and hosting your own serverless function just to keep API keys off the frontend, which is more than this project needs right now. EmailJS is a reasonable second choice but its free tier is more limited and file-attachment support is less reliable.

**Setup:**
1. Create a free account at formspree.io.
2. Create a new form, copy the endpoint URL it gives you (looks like `https://formspree.io/f/xxxxxxx`).
3. Paste that URL into `config.js` → `formEndpoint`.
4. Submissions will arrive at `jaydenspremier@icloud.com` by default, or whatever email you used to sign up.

No API key ever needs to go in the frontend code with this approach.

## Deploying to Vercel

1. **Create a GitHub repo** and push these files (the whole folder) to it.
2. **Go to vercel.com** → New Project → import that GitHub repo.
3. Framework preset: choose **"Other"** (this is a static site, no build step needed). Leave build command empty and output directory as `.`.
4. Click **Deploy**. Vercel gives you a temporary URL like `jaydens-premier.vercel.app` within about a minute.
5. **Connect your own domain:** in the Vercel project → Settings → Domains → add your domain, then update your domain's DNS records (Vercel shows you exactly which ones) with your domain registrar.
6. **Updating the site later:** push new commits to the GitHub repo — Vercel redeploys automatically on every push to the main branch.
7. **Environment variables:** not needed just to get the public site live (Formspree handles the estimate form server-side). If you're also setting up the admin panel, see the next section — it needs a few.

## Admin panel (add/edit/delete projects and reviews without touching code)

The site includes a small admin panel at `/admin` for managing **projects**
(before/after photos) and **client reviews** — the two things you'll want to
update constantly. Everything else (services, About text, contact info)
still goes through `data.js`/`config.js` as described above.

It's built with Vercel's own serverless functions, KV (a small database),
and Blob (photo storage) — no separate service or account needed beyond
Vercel itself.

### One-time setup

1. **Push this whole folder to a GitHub repo and deploy it on Vercel** (see
   "Deploying to Vercel" below, if you haven't already).
2. **Create the two storage connections**, both from your Vercel project's
   **Storage** tab:
   - **Storage → Create Database → KV** (Vercel may show this as
     "Upstash for Redis" — same thing, that's fine). Connect it to this
     project. This auto-adds the `KV_REST_API_URL` and `KV_REST_API_TOKEN`
     environment variables — you don't type those in yourself.
   - **Storage → Create Database → Blob**. Connect it to this project too.
     This auto-adds `BLOB_READ_WRITE_TOKEN`.
3. **Add three more environment variables by hand**, under
   Project → Settings → Environment Variables:
   - `ADMIN_EMAIL` — the email you'll log in with.
   - `ADMIN_PASSWORD` — your starting password. This is only read on your
     very first login (it seeds the real, securely-hashed password in KV).
     After that first login, changing your password in the panel itself is
     what takes effect — this variable is never read again.
   - `SESSION_SECRET` — any long random string, used to sign your login
     session. Generate one by running this once on your computer (needs
     Node installed) and pasting the output:
     ```
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
4. **Redeploy** (Vercel → Deployments → ⋯ → Redeploy) so the new
   environment variables take effect.
5. Visit `https://your-domain.com/admin`, sign in with `ADMIN_EMAIL` /
   `ADMIN_PASSWORD`, and change your password right away from the
   "Change password" button — from then on, use the new one.

See `.env.example` for a summary of every variable. Never put real values
in a committed file — only in Vercel's Environment Variables (or a local
`.env.local`, which `.gitignore` already keeps out of git).

### Using the panel day to day

- **Projects tab** — "Add project" asks for a job name, service, city, and
  the before/after photos. Keep photos under ~3MB (compress large phone
  photos first) — Vercel's serverless functions cap request size at 4.5MB.
  Editing a project only requires re-uploading a photo if you want to
  replace it; leaving a photo field empty keeps the existing one.
- **Reviews tab** — "Add review" asks for the client's name, service, city,
  and the review text. There's no fixed limit on how many projects or
  reviews you can add — the public site's "Our work" section automatically
  paginates with a "See more" button once there are more than 6.
- Changes appear on the live site within moments — no redeploy needed,
  since the public pages read projects/reviews from the same database the
  panel writes to.
- If `/admin` isn't reachable yet (or you haven't finished the setup
  above), the public site simply keeps showing the existing placeholder
  content — nothing breaks either way.



- [ ] All nav links and footer links scroll to the right section
- [ ] Mobile menu opens/closes and closes after clicking a link
- [ ] "Call now" opens the phone dialer on a real mobile device
- [ ] Email links open the default mail client
- [ ] Hero video autoplays muted and loops on desktop and mobile
- [ ] Hero falls back to the static image with "reduce motion" enabled in OS settings
- [ ] Before/after slider works with mouse drag, touch drag, and keyboard arrows
- [ ] Form shows an error under any empty required field on submit
- [ ] Form rejects a non-image file and a file over 8MB with a clear message
- [ ] Form shows the "not connected yet" message until `formEndpoint` is set
- [ ] After setting `formEndpoint`, a real test submission arrives by email
- [ ] Site is checked on an actual iPhone and an actual Android phone, not just a resized browser window
- [ ] Run the page through Google's PageSpeed Insights and Lighthouse (Chrome DevTools) for performance/accessibility/SEO scores
- [ ] Check for console errors in browser DevTools
- [ ] `/admin` setup finished (KV + Blob connected, env vars set) and you can log in
- [ ] Changed the password from the default right after your first login
- [ ] Added, edited, and deleted a test project from the admin panel, and confirmed it shows up (and disappears) on the public site
- [ ] Added and deleted a test review the same way
- [ ] "See more" button on Our work appears once there are more than 6 projects
