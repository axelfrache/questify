repo: axelfrache/questify
branch: main
path: frontend/src

## Last sync
date: 2026-08-16T18:51:47Z

### Updated in this project
- Designed "Quest Weaver": AI project-brief-to-quests generator, entered from the new-project flow.
- Review step lets the user select/edit/remove suggested quests (difficulty, XP, region) before creation.
- Built pixel-matched to Questify's existing tokens (oklch palette, Geist font, quest card/badge/dialog conventions).

## Screen map
| Project screen | Repo source |
|---|---|
| Quest Weaver.dc.html (sidebar/header chrome) | frontend/src/components/AppSidebar.tsx, frontend/src/layouts/AppLayout.tsx |
| Quest Weaver.dc.html (quest cards, difficulty/XP styling) | frontend/src/components/QuestCard.tsx, frontend/src/lib/quest-config.ts, frontend/src/index.css |
| Quest Weaver.dc.html (project creation fields) | frontend/src/pages/ProjectsPage.tsx (CreateProjectDialog), frontend/src/components/CreateQuestDialog.tsx |
