# China University 2026 Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a GitHub Pages site for China mainland higher-education 2026 research, starting with official baseline tables and a school-level database.

**Architecture:** Static Vite React site backed by generated JSON data files. Data generation downloads official Ministry of Education school-list XLS files, combines them with manually curated official aggregate tables, validates row counts, and emits public data artifacts used by the UI.

**Tech Stack:** Vite, React, TypeScript, Node.js test runner, `xlsx`, GitHub Pages.

---

### Task 1: Data Contract And Tests

**Files:**
- Create: `test/data-contract.test.js`
- Create: `test/site-contract.test.js`

- [ ] Write tests that require `public/data/summary.json`, `public/data/province-stats.json`, `public/data/schools.json`, `public/data/admissions-2026.json`, and built page content.
- [ ] Run `npm test` and confirm the tests fail because artifacts are missing.

### Task 2: Data Build

**Files:**
- Create: `scripts/build-data.js`
- Create: `src/data/official-baseline.js`
- Generate: `public/data/*.json`

- [ ] Download the 2025-06-20 Ministry of Education ordinary/adult higher-school XLS files.
- [ ] Parse school records and validate totals: 3167 total, 2919 ordinary, 248 adult, 1365 undergraduate, 1554 higher vocational.
- [ ] Emit national summary, province stats, school database, source list, and 2026 admissions-tracking placeholders.

### Task 3: Static Website

**Files:**
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`

- [ ] Build pages for overview, province distribution, school database, admissions tracking, and conclusions.
- [ ] Include source citations and explicit caveats about 2026 final statistics not being fully released yet.

### Task 4: Verification And Deployment

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `vite.config.ts`

- [ ] Run `npm test` and `npm run build`.
- [ ] Commit all files.
- [ ] Create/push GitHub repo using the local authenticated account.
- [ ] Enable GitHub Pages through Actions and verify deployment URL.
