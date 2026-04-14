# Tree-Climber

**Tree Climber** is a web app for planning course schedules and visualizing **Webtree**-style preference trees. You search the course catalog, rank selections, and the app suggests conflict-free schedules and tree layouts you can preview on a weekly calendar or export as a PDF.

## Team

**Group #4**

- Lars Oehler — Developer and Product Owner
- Madeline Shi — Developer
- Ross Hope — Developer and Scrum Master
- Samantha Galvan — Developer

## Tech stack

- **React 18** with **Vite** (dev server, hot reload, production builds)
- **Supabase** — course and meeting data loaded from a hosted Supabase project (PostgreSQL + API)
- **html2canvas** + **jsPDF** — “Download PDF” for the Webtree preview

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** (comes with Node)

## Setup

1. Clone the repository and open the project folder.

2. Install dependencies:

   ```bash
   npm install
   ```

## Commands

| Command           | Description                                      |
|-------------------|--------------------------------------------------|
| `npm run dev`     | Start the Vite dev server (default: `localhost:5173`) |
| `npm run build`   | Production build output in `dist/`               |
| `npm run preview` | Serve the `dist/` build locally to verify production output |

## How to use the app

1. **Load courses** — On open, the app loads the course catalog from Supabase. Wait until the status line shows that courses are loaded (or fix env/credentials if you see an error).

2. **Add courses** — In **Add a course**, type a CRN, course title, or section; pick from suggestions if shown. Press **Add** or Enter. Repeat to build your list.

3. **Order matters** — Drag and drop rows in **Selections** to set priority (order affects Webtree layout and schedule ranking).

4. **Build schedules** — Click **Build schedules** to refresh ranked, conflict-aware schedule options from your active selections.

5. **Preview** — Use **Preview schedule** to switch among generated schedules. The **calendar** shows that schedule by day and time.

6. **Webtree** — Scroll to **WebTree Preview** to see Trees 1–4 filled from your selections and the currently selected schedule. Use **Download PDF** to save that preview as a PDF.

7. **Help** — Click **Help** in the header for a short usage summary.

## Project layout

- `src/App.jsx` — Supabase client, catalog load, schedule logic, page shell
- `src/components/` — UI sections (hero, course input, calendar, schedules, webtree, etc.)
- `src/lib/` — Pure helpers (`courseUtils.js`, `constants.js`) for matching and schedule generation
- `index.html` — Vite entry HTML
- `vite.config.js` — Vite + React plugin
