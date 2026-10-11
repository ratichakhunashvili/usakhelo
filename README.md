# Akakis Samushao — glass recycling prototype (Tbilisi)

A front-end prototype of the mobile app from the Figma project "akakis samushao":
browse glass-recycling places, compare **illustrative** payouts, save places, explore them on a
real interactive map, and estimate recycling earnings.

> No backend, auth or payments. All places, rates, ratings, distances and the balance are
> **illustrative sample data** and are labelled as unverified in the UI.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build
```

## Deploy to Vercel

This project is a static Vite app and is ready for Vercel deployment without a custom server.

1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Use the default settings:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

A `vercel.json` file is included so SPA paths resolve correctly during deployment.

Stack: React 18 + TypeScript + Vite, Leaflet (used directly, no wrapper), Inter via `@fontsource-variable/inter`.
No router or state library: screens are driven by hash routes (`#/places`, `#/map/<id>`, `#/places/<id>/details`, `#/user`),
so browser Back/Forward and deep links work. The map is a lazy chunk and is preloaded when the browser is idle.

## Where things live

| Path | What |
| --- | --- |
| `src/data/places.ts` | Typed sample places (coordinates, rates, ratings). Single source of truth. Distances are computed from coordinates (straight line from Freedom Square). "Highest payout" is derived from the rates. |
| `src/config/map.ts` | **Tile URL, attribution, zoom.** Replace the tile provider here. |
| `src/components/LeafletMap.tsx` | The imperative Leaflet wrapper: map and markers are created once; pan/zoom never re-render React. |
| `src/screens/` | `PlacesScreen`, `MapScreen` (lazy), `ProfileScreen` |
| `src/components/` | `PlaceCard`, `PlaceDetail`, `SelectedPlacePanel`, `EarningsCalculator`, `BottomNavigation`, `Sheet`, … |
| `src/lib/` | hash router, local state (saved ids + language, persisted in `localStorage`), i18n (English / ქართული) |
| `src/styles.css` | Design tokens (`#E8ECEF`, `#A6C7E6`, `#C5D8E6`, `#1C2B48`) and all styles |

## Behaviour notes

- **Saved count:** the Places screen shows all four places with a "2 of 4 saved" count and an `All places / Saved only` filter; a saved place is marked with a filled bookmark, not colour alone. First visit seeds two saved places; changes persist.
- **Map:** markers show the payout; the highest payout has a star and a blue fill, the selected one is filled navy. Marker, search and details all share the same selection (in the URL). Markers are keyboard-focusable (Enter / Space).
- **Locate me:** only asks for permission after the tap; denial/unavailable shows a message and nothing else changes.
- **Tiles fail to load** (offline, blocked provider): a banner explains it and links to the list; markers, search and details keep working.
- **Language:** English and Georgian for all UI text. Place names and street names stay in Latin script (they are sample data).

## Limitations

- The default tiles are the public **OpenStreetMap** server — fine for a prototype, **not for production traffic** ([tile usage policy](https://operations.osmfoundation.org/policies/tiles/)). Use a hosted provider (and its API key via your own proxy/env, never committed) before shipping. The blue-gray look is a CSS filter on the tile pane (`.leaflet-tile-pane` in `styles.css`); with a provider that offers a native light/gray style you can drop it.
- Coordinates are plausible for each named avenue/district but **not verified**; the businesses are fictional.
- The calculator's non-glass materials (plastic, metal, paper) are invented illustrative rates so the selector is meaningful; glass at 5 GEL/kg is from the brief.
- Log out only hides the sample profile for the current page view; there is no authentication.
