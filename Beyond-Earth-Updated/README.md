# Beyond Earth

Beyond Earth is a pixel-art field research game about choosing Earth locations for early Mars equipment trials. It combines five explorable locations, equipment simulations and a research notebook.

## Play and review

- Open the live game from the production URL on the Vercel project dashboard.
- To play the initial snapshot offline, download the repository ZIP, extract it, and open `docs/index.html` in a browser.
- Read the [project brief and judge walkthrough](project/PROJECT.md) and [research data guide](project/RESEARCH_DATA.md).

## Edit in VS Code

Install Node.js 24 (or Node.js 22.12 or later in the 22.x series) and pnpm 11.25.0. Open the repository folder in VS Code and run:

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

Open the local link printed in the terminal.

| To change | Edit |
| --- | --- |
| Home, city, airport and field maps | src/game/maps |
| Tools, inventory and field trials | src/game/inventory.ts and src/game/fieldTrials.ts |
| Scientific properties and Earth–Mars comparisons | src/game/siteProperties.ts |
| Destinations, airport gates and missions | public/data/destinations.json and public/data/missions.json |
| Menus and HUD | src/ui and src/index.css |

## Deploy on Vercel from GitHub

1. Publish this folder to a GitHub repository. Put `package.json` and `vercel.json` at the repository root.
2. In Vercel, choose **Add New → Project**, connect GitHub, and import the repository. Keep the **Root Directory** at the repository root.
3. Keep **Vite** as the framework. The checked-in `vercel.json` sets the dependency install command, runs `npm run build` and serves `dist`. This project needs no environment variables.
4. Click **Deploy**. After deployment, open the production URL in a private browser window to verify that judges can open it.

Push edits to the connected production branch to update the deployment. For local verification, run `pnpm typecheck`, `pnpm build` and `pnpm preview`.

GitHub Pages is also supported. Run `pnpm build:pages`, commit the updated `docs` folder, and select **Settings → Pages → Deploy from a branch → main → /docs**.

The story, flight tickets and equipment scenarios are fictional. The game stores imported measurements in the current browser.
