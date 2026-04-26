# Tree-Climber

**Tree Climber** is a web app for planning course schedules and visualizing **Webtree**-style preference trees. You search the course catalog, rank selections, and the app suggests conflict-free schedules and tree layouts you can preview on a weekly calendar or export as a PDF.

## Team

**Group #4**

- Lars Oehler — Developer and Product Owner
- Madeline Shi — Developer
- Ross Hope — Developer and Scrum Master
- Samantha Galvan — Developer

## Problem and motivation

Davidson’s Webtree system requires students to translate a normal ranked course list into four preference trees. This process can be confusing because students often need to compare the course catalog, DegreeWorks, schedule conflicts, and Webtree rules at the same time.

Tree Climber is designed as a helper tool for this workflow. Instead of asking students to manually reason through every possible schedule conflict and tree placement, the app lets users search for courses, rank their preferences, preview possible schedules, and see a Webtree-style output that can guide their final registration choices.

The main user story is:

> As a student planning registration, I want to enter and reorder the courses I am interested in so that I can quickly see possible schedules and understand how my preferences might translate into Webtree-style trees.

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

3. Optional: copy `.env.example` to `.env.local` and provide Supabase credentials if you do not want to use the default hosted values.

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

The repository contains one frontend application and a small set of supporting data-prep artifacts. The production backend is a hosted Supabase project, so there is no local server directory in this repo.

- `src/App.jsx` — top-level application state and page composition
- `src/components/` — presentational React components for input, schedule preview, calendar, and Webtree output
- `src/services/catalog.js` — backend-facing catalog loader and response normalization
- `src/lib/constants.js` — shared UI and scheduling constants
- `src/lib/text.js` — string normalization helpers
- `src/lib/time.js` — time parsing and display formatting helpers
- `src/lib/courseSearch.js` — catalog search indexing and selection matching
- `src/lib/coursePresentation.js` — shared course and meeting display labels
- `src/lib/scheduling.js` — conflict detection, schedule ranking, and calendar placement logic
- `src/lib/webtree.js` — Webtree-specific selection resolution and tree generation
- `docs/data-prep/` — notebook and CSV assets used during data preparation, kept separate from app runtime code
- `index.html` — Vite entry HTML
- `vite.config.js` — Vite + React plugin configuration

## Maintenance notes

- Shared logic is separated by concern so utility modules stay cohesive and easier to test.
- JSDoc comments are included on exported helpers and service functions to make intent easier to scan in-editor.
- Generated artifacts such as `dist/`, Vite cache files, and notebook checkpoints are ignored in Git.

## Known limitations and future work

- The app currently depends on the course data available in the connected Supabase project, so missing or outdated catalog data may affect search results and schedule generation.
- The calendar preview focuses on the first four active selections, while later selections may still be used to warn users about potential time conflicts.
- Future improvements could include clearer backend documentation, automated tests for schedule generation, and more detailed onboarding examples for first-time Webtree users.
- A longer-term improvement would be to further separate frontend UI logic, data loading, and scheduling logic so that each part of the project is easier to maintain and test.