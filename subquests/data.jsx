// Seed data for the prototype
var SEED_QUESTS = [
  { id: 'q1', title: "Refactor auth microservice", region: 'Work', difficulty: 'Epic', xp: 150, due: '2026-04-19', recurrence: 'One-time', project: null, status: 'open', comfort: 'Stretch' },
  { id: 'q2', title: "Morning run — 5k", region: 'Sport', difficulty: 'Medium', xp: 80, due: '2026-04-19', recurrence: 'Daily', project: null, status: 'open', comfort: 'Cozy' },
  { id: 'q3', title: "Read chapter 3 — Designing Data-Intensive Apps", region: 'Learn', difficulty: 'Easy', xp: 40, due: '2026-04-20', recurrence: 'One-time', project: 'p1', status: 'open', comfort: 'Cozy' },
  { id: 'q4', title: "Plan Q2 OKRs with team", region: 'Work', difficulty: 'Hard', xp: 120, due: '2026-04-21', recurrence: 'One-time', project: null, status: 'open', comfort: 'Stretch' },
  { id: 'q5', title: "Meal prep for the week", region: 'Life', difficulty: 'Medium', xp: 60, due: '2026-04-19', recurrence: 'Weekly', project: null, status: 'open', comfort: 'Cozy' },
  { id: 'q6', title: "Ship redesign proposal", region: 'Work', difficulty: 'Epic', xp: 200, due: '2026-04-22', recurrence: 'One-time', project: 'p2', status: 'open', comfort: 'Stretch' },
  { id: 'q7', title: "Call mom", region: 'Life', difficulty: 'Easy', xp: 20, due: '2026-04-19', recurrence: 'Weekly', project: null, status: 'open', comfort: 'Cozy' },
  { id: 'q8', title: "Gym — upper body", region: 'Sport', difficulty: 'Hard', xp: 100, due: '2026-04-22', recurrence: 'Weekly', project: null, status: 'open', comfort: 'Stretch' },
  { id: 'q9', title: "Write blog post about microservices", region: 'Learn', difficulty: 'Hard', xp: 120, due: '2026-04-23', recurrence: 'One-time', project: 'p1', status: 'open', comfort: 'Stretch' },
  { id: 'q10', title: "Rénover salle de bain — devis", region: 'Life', difficulty: 'Medium', xp: 50, due: '2026-04-24', recurrence: 'One-time', project: 'p3', status: 'open', comfort: 'Cozy' },
];

var SEED_COMPLETED = [
  { id: 'c1', title: "Setup dev environment", xp: 50, completedAt: '2026-04-19T09:12' },
  { id: 'c2', title: "Review PR #482", xp: 30, completedAt: '2026-04-19T10:30' },
  { id: 'c3', title: "Stretching", xp: 20, completedAt: '2026-04-18T07:05' },
  { id: 'c4', title: "Team standup", xp: 20, completedAt: '2026-04-18T10:00' },
  { id: 'c5', title: "Weekly review", xp: 80, completedAt: '2026-04-17T18:20' },
];

var SEED_HABITS = [
  { id: 'h1', title: "Morning meditation", cadence: 'Daily', difficulty: 'Easy', xp: 20, streak: 14 },
  { id: 'h2', title: "Go to gym", cadence: 'Weekly', difficulty: 'Hard', xp: 100, streak: 6 },
  { id: 'h3', title: "Read 20 pages", cadence: 'Daily', difficulty: 'Easy', xp: 20, streak: 9 },
  { id: 'h4', title: "Weekly review", cadence: 'Weekly', difficulty: 'Medium', xp: 60, streak: 4 },
];

var SEED_REGIONS = [
  { id: 'Work', name: 'Work', count: 14, emoji: '⌘', tint: 'oklch(0.58 0.14 270)' },
  { id: 'Life', name: 'Life', count: 9, emoji: '◐', tint: 'oklch(0.68 0.13 145)' },
  { id: 'Sport', name: 'Sport', count: 6, emoji: '◇', tint: 'oklch(0.72 0.14 45)' },
  { id: 'Learn', name: 'Learn', count: 4, emoji: '◉', tint: 'oklch(0.65 0.14 220)' },
];

var SEED_PROJECTS = [
  { id: 'p1', name: 'Questify', desc: 'Ship v1 of the open-source quest manager', questCount: 12, updated: '2h ago', emoji: '⊛' },
  { id: 'p2', name: 'Redesign', desc: 'New UI pass on core screens', questCount: 8, updated: '1d ago', emoji: '◒' },
  { id: 'p3', name: 'Appartement', desc: 'Travaux & déménagement', questCount: 6, updated: '3d ago', emoji: '◈' },
  { id: 'p4', name: 'Learning Rust', desc: 'Work through the book + build a project', questCount: 5, updated: '5d ago', emoji: '◇' },
];

var GRADES = [
  { name: 'Initiate', minLevel: 1, maxLevel: 5 },
  { name: 'Traveler', minLevel: 6, maxLevel: 10 },
  { name: 'Explorer', minLevel: 11, maxLevel: 20 },
  { name: 'Adventurer', minLevel: 21, maxLevel: 35 },
  { name: 'Hero', minLevel: 36, maxLevel: 50 },
  { name: 'Legend', minLevel: 51, maxLevel: 99 },
];

var DIFFICULTIES = {
  Trivial: { xp: 10, tint: 'oklch(0.85 0.02 270)' },
  Easy:    { xp: 40, tint: 'oklch(0.78 0.10 150)' },
  Medium:  { xp: 80, tint: 'oklch(0.75 0.12 230)' },
  Hard:    { xp: 120, tint: 'oklch(0.72 0.14 45)' },
  Epic:    { xp: 200, tint: 'oklch(0.62 0.18 290)' },
};

window.Data = { SEED_QUESTS, SEED_COMPLETED, SEED_HABITS, SEED_REGIONS, SEED_PROJECTS, GRADES, DIFFICULTIES };
