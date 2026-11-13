# SnowPro Core (COF-C03) Study App

Interactive study plan, notes, flashcards (spaced repetition) and quizzes for the SnowPro Core exam.

```bash
npm install
npm run dev      # local dev server
npm run build    # validate content + type-check + build to dist/
```

## Content

All study material lives in `content/` — edit data, not code:

```
content/
  domains.json          # domains, weights, objectives
  plan.json             # 6-week plan tasks
  d1/                   # one folder per domain
    1.1.md … 1.6.md     # notes per objective
    flashcards.json     # { id, objective, front, back }
    questions.json      # { id, objective, question, options[], answer[], explanation, ref }
```

`npm run validate` checks ids, objectives and answer indexes; the build fails on bad content.
Progress is stored in the browser (localStorage) and can be exported/imported from the Plan page.

## Deploy

`.github/workflows/deploy.yml` builds on every PR and deploys to GitHub Pages on push to `main`.
One-time setup: **Settings → Pages → Source: GitHub Actions**.
