# Snip & Sum

Snip & Sum is a progressive web app that lets you capture snippets of numbers from any screen, classify them as positive or
negative, and watch page and grand totals update in real-time. The project currently ships the foundational shell, PWA
infrastructure, and state model for multi-page captures while the capture overlay and OCR pipeline are being implemented.

## Tech stack

- **React + Vite + TypeScript** for the front-end experience
- **Tailwind CSS** for theming and rapid iteration
- **Zustand** to manage capture sessions, pages, and selected totals
- **Tesseract.js** (wired for future use) to power on-device OCR
- **Vite PWA plugin** to provide installability and offline caching when deployed

## Getting started

```bash
npm install
npm run dev
```

The development server runs on [http://localhost:5173](http://localhost:5173). Service workers are only registered in production
builds, so install prompts will appear after running `npm run build` followed by `npm run preview`.

## Project structure

```
src/
  components/     # Banner, overlay, and dashboard panels
  lib/            # OCR service scaffold
  state/          # Zustand store describing pages, regions, and selection state
  types/          # Shared TypeScript contracts
  utils/          # Formatting helpers and ID generation
```

## Next milestones

- Implement the screen capture overlay backed by `getDisplayMedia`
- Connect region staging to the OCR service and persist parsed tokens
- Surface editable +/- toggles with live page and cross-page totals
- Export annotated snips and raw images as part of the review flow

## License

This repository is provided without an explicit license. Please contact the maintainers before using the code commercially.
