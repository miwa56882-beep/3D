# 3D Campus Guide

School festival campus guide built from the provided `1F.bmp` to `4F.bmp` floor plans.

## Repository layout

- `docs/index.html`: GitHub Pages publish target
- `submission/index.html`: single-file deliverable copy
- `index.html`: latest single-file build in the project root
- `src/main.js`: Three.js scene and UI logic
- `src/floorData.js`: floor metadata and clickable guide spots
- `build-single-html.mjs`: bundles the modular source into one HTML file

## Development

Install dependencies if needed:

```powershell
npm install
```

Rebuild the single-file output:

```powershell
npm run build:single
```

This command updates all of the following at once:

- `index.html`
- `docs/index.html`
- `submission/index.html`

## Local preview

```powershell
python -m http.server 8000
```

Open `http://localhost:8000`.

## GitHub Pages

Use the repository's `main` branch with the `/docs` folder as the Pages source.

After pushing to GitHub:

1. Open repository `Settings`
2. Open `Pages`
3. Set `Build and deployment` source to `Deploy from a branch`
4. Select branch `main`
5. Select folder `/docs`

The published site URL can then be embedded in Google Sites with `Insert > Embed`.
