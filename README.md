# Open-Source University Project Dashboard

A futuristic, interactive web dashboard built to visualize contributions to a shared university open-source project.

## Features

- **Futuristic UI**: Dark theme, neon accents, and glassmorphism.
- **Interactive Graph**: Powered by Cytoscape.js, representing features and their connections.
- **Dynamic Stats**: Real-time mock overview of contributors and project state.
- **Activity Log**: Simulated updates injected into the activity feed.
- **Local JSON Data**: Easy to customize logic without complex backends.

## Prerequisites

- Node.js (v18+ recommended)

## How to Run

1. Clone or download this repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the local URL provided by Vite (e.g. `http://localhost:5173`).

## Where to Edit Features

All feature nodes, descriptions, domains (fields), and contributors are defined in:
`public/data/features.json`

You can add new objects to this JSON array, and they will automatically appear on the graph. The color coding is determined automatically based on the `field` property.

## How to change Repository URL

To modify the destination of the "Ajouter un nœud" button at the top:
1. Open `src/ui.js`
2. Locate the `bindStaticEvents` function.
3. Replace the URL in `const repoUrl = 'https://github.com/example/open-source-university-project';` with your actual repository URL.

## Built With

- Vanilla JavaScript
- Vite
- Cytoscape.js
