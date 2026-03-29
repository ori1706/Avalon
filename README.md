# Avalon

A Progressive Web App for The Resistance: Avalon, a social deduction board game.

## Features

- **Pass & Play** — single device, pass between players (fully offline)
- **Online Room** — each player uses their own device (via Firebase)
- **All roles** — Merlin, Assassin, Percival, Morgana, Mordred, Oberon
- **Lady of the Lake** — optional loyalty inspection mechanic
- **Installable PWA** — add to iOS home screen for native-like experience

## Getting Started

```bash
npm install
npm run dev
```

## Online Room Setup

To enable the Online Room mode, create a Firebase project and add your config:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Realtime Database
4. Copy your web app config
5. Create a `.env` file (see `.env.example`) with your Firebase credentials

## Deploying

```bash
npm run build
```

Deploy the `dist/` folder to any static host (Vercel, Netlify, GitHub Pages).
After deploying, open the URL in Safari and use "Add to Home Screen" to install.

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand (state management)
- Firebase Realtime Database (online multiplayer)
- vite-plugin-pwa (service worker + manifest)
