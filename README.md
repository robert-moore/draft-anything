# Draft Anything

## 🧱 Stack

### Core Framework

- [Next.js](https://nextjs.org/) - App Router, React Server Components
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vercel AI SDK](https://sdk.vercel.ai/docs) - Text streaming / Generative UI

### Authentication & Authorization (Updated Category)

- [Supabase](https://supabase.com/) - User authentication and backend services

### UI & Styling

- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Re-usable components
- [Radix UI](https://www.radix-ui.com/) - Unstyled, accessible components
- [Lucide Icons](https://lucide.dev/) - Beautiful & consistent icons

## 🚀 Quickstart

### 1. Fork and Clone repo

Fork the repo to your Github account, then run the following command to clone the repo:

```bash
git clone git@github.com:robert-moore/draft-anything.git
```

### 2. Install dependencies

```bash
cd draft-anything
bun install
```

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in the required environment variables in `.env.local`:

```bash
# Required for Core Functionality
SUPABASE_URL=     # Get from https://app.supabase.com/
SUPABASE_ANON_KEY=     # Get from https://app.supabase.com/
SUPABASE_SERVICE_ROLE_KEY=     # Get from https://app.supabase.com/
```

### 4. Run app locally

#### Using Bun

```bash
bun dev
```
