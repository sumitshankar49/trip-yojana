# TripYojana 🌍

A comprehensive travel planning application built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🔐 **Authentication** - Login/signup with validation
- 📋 **Dashboard** - View and manage all your trips
- ✈️ **Trip Creation** - Multi-step form for creating trips
- 📅 **Itinerary Planner** - Drag-and-drop itinerary builder
- 🗺️ **Map View** - Interactive Mapbox integration with markers and routes
- 💰 **Budget Tracking** - Track expenses by category
- 👥 **Group Expenses** - Split expenses and calculate settlements

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Mapbox access token:
- Get a free token at [https://account.mapbox.com/](https://account.mapbox.com/)
- Add it as `NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here`

### Running the Development Server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
