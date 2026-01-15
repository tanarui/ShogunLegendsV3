# Shogun Legends

A strategic factor-based battle game built with React and Vite.

## Features

- MBTI-based personality quiz system
- Strategic unit recruitment and placement
- Factor-based stat modifications
- Multiple game modes (Normal, Challenge, Hell Mode, PvP)
- Team hashcode sharing for PvP battles
- LocalStorage-based profile saving with lazy initialization

## Development

```bash
npm install
npm run dev
```

## Build for Production

```bash
npm run build
```

## GitHub Pages Deployment

This project is configured to deploy to GitHub Pages automatically via GitHub Actions.

1. The repository must have GitHub Pages enabled in Settings > Pages
2. Select "GitHub Actions" as the source
3. The workflow will automatically build and deploy on pushes to `main` branch

The app will be available at: `https://tanarui.github.io/ShogunLegendsV3/`

## LocalStorage

The app uses lazy initialization for localStorage access, which:
- Checks localStorage availability before use
- Handles cases where localStorage is unavailable (private browsing, etc.)
- Provides graceful fallbacks

## Project Structure

- `src/App.jsx` - Main application component
- `src/data/gameData.js` - Character and game data
- `src/modules/profile.js` - Profile management with localStorage
- `src/modules/quiz.js` - MBTI quiz logic
- `src/modules/factorReturns.js` - Factor return calculations
- `src/utils/gameUtils.js` - Game utility functions
- `src/utils/unitUtils.js` - Unit placement utilities
