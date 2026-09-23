repo: axelfrache/questify
branch: main
path: frontend/src

## Last sync
date: 2026-08-16T20:23:53Z

### Updated in this project
- Designed "Quest Weaver": AI project-brief-to-quests generator, entered from the new-project flow.
- Review step lets the user select/edit/remove suggested quests (difficulty, XP, region) before creation.
- Added Import/Export to the Projects page (toolbar import dialog, per-card export dialog).
- Proposed a narrative grade renaming ("The Journey": Initiate → Wanderer → Adventurer → Vanguard → Luminary → Legend) replacing the generic mineral tiers, with per-grade color/shape.

## Screen map
| Project screen | Repo source |
|---|---|
| Quest Weaver.dc.html (sidebar/header chrome) | frontend/src/components/AppSidebar.tsx, frontend/src/layouts/AppLayout.tsx |
| Quest Weaver.dc.html (quest cards, difficulty/XP styling) | frontend/src/components/QuestCard.tsx, frontend/src/lib/quest-config.ts, frontend/src/index.css |
| Quest Weaver.dc.html (project creation fields) | frontend/src/pages/ProjectsPage.tsx (CreateProjectDialog), frontend/src/components/CreateQuestDialog.tsx |
| Projects.dc.html | frontend/src/pages/ProjectsPage.tsx |
| Grade System.dc.html | frontend/src/lib/grade-config.ts, frontend/src/components/ui/grade-badge.tsx, frontend/src/pages/ProgressPage.tsx |
