# Portfolio — Setup & Update Guide

## One-time setup (GitHub Pages)

1. Go to https://github.com and sign in (or create a free account, e.g. username `bhalajid`).
2. Click **New repository** → name it exactly `bhalajid.github.io` (your-username`.github.io`) → Public → Create.
3. Click **Add file → Upload files** → upload `index.html` **and your photo saved as `profile.jpg`** → Commit. (No photo yet? The page auto-hides the portrait until `profile.jpg` exists.)
4. Wait 1–2 minutes. Your portfolio is live at:

   **https://bhalajid.github.io**

5. Put that URL on your CV (header, next to LinkedIn). Companies just click it — no GitHub account needed on their side.

## How companies access it

It's a normal public website. Anyone with the link sees it instantly — recruiters, ATS reviewers, hiring managers. It also shows up professionally when they Google your name.

## Per-application update workflow (the "dynamic" part)

When you apply for a new job, tell Claude: *"Update my portfolio for this job"* and paste the job description. Claude will edit the `SKILLS` array in `index.html`:

- `hi: true` → highlights skills matching that job's keywords (blue chips)
- New line added → only if it's a skill you **actually have** that wasn't listed yet
- `isNew: true` → optional dashed marker for recently added skills

Then re-upload `index.html` to GitHub (Upload files → replace → Commit). Live in ~1 minute.

### Honesty rule (built in)

The portfolio is your **complete, true skill inventory**. Tailoring only changes *emphasis and order* — never invents skills. This way every keyword on a tailored CV genuinely exists on your portfolio, so nothing looks inconsistent.

## Editing skills manually

Open `index.html`, find the block marked:

```
✏️  SKILL INVENTORY — EDIT HERE FOR EACH NEW APPLICATION
```

Each skill is one line:

```js
{ cat: "cloud", name: "Azure Virtual Desktop (AZ-140)", hi: true },
```

Categories: `citrix`, `cloud`, `infra`, `method`. Save, re-upload, done.
