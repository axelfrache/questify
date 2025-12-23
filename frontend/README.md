# Questify Frontend

## Description

Web application for Questify, a gamified task management application. Built with React and TypeScript.

## Tech Stack

- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI + shadcn/ui
- **Routing**: React Router 7
- **State Management**: TanStack Query

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
npm install
```

### Running

**Development mode:**
```bash
npm run dev
```

**Production build:**
```bash
npm run build
```

**Preview production build:**
```bash
npm run preview
```

### Endpoints

- Development: http://localhost:5173
- Production (Docker): http://localhost:80

## Project Structure

```
src/
├── components/     # Reusable UI components
│   └── ui/         # shadcn/ui components
├── contexts/       # React contexts (Auth, Theme)
├── hooks/          # Custom React hooks
├── layouts/        # Layout components
├── lib/            # Utilities and API client
└── pages/          # Page components
```

## Code Quality

This project uses **ESLint** and **Prettier**.

```bash
npm run lint          # Check linting
npm run format:check  # Check formatting
npm run format        # Fix formatting
```

## License

MIT License - see [LICENSE](../LICENSE) for details.
