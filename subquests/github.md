repo: axelfrache/questify
branch: main
path: frontend/src

## Last sync
date: 2026-09-22T13:01:27Z

### Updated in this project
- Inbox exploration (`inbox-subquests.html`) reworked to match the real per-quest action model: hover ⋮ menu (Edit, Skip if recurring, Add subquest, Delete), delete confirmation dialog, subquest rows with their own Edit/Delete menu.
- Subquest progress shown inline (mini progress bar + n/m) across all three density modes (Comfort/Compact/Ultra), matching the app's actual Comfort/Compact toggle plus a speculative denser Ultra mode.
- Recurrence indicator icon added to quest rows.

## Screen map
| Project screen | Repo source |
|---|---|
| inbox-subquests.html | frontend/src/pages/InboxPage.tsx, frontend/src/components/QuestCard.tsx, InlineSubquests.tsx, SubquestList.tsx, inbox/InboxControls.tsx, ConfirmDialog.tsx |
