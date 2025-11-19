# Repository Guidelines

## Project Structure & Module Organization
Vite drives the build: `index.html` mounts `src/main.tsx` and React UI logic lives in `src/App.tsx` plus `App.css`/`index.css`. Browser plumbing sits under `src/background.ts` (options tab launcher) and `src/content.ts` (ChatGPT injector). Static assets (`manifest.json`, icons/) stay under `public/` and are copied to `build/` when you run `npm run build`. Anything that must be published with the extension belongs in `src/` or `public/`; avoid reviving the legacy root-level JS/CSS files that have been removed.

## Build, Test, and Development Commands
- `npm install` installs React/Vite/TypeScript dependencies.
- `npm run dev` spins up the React options UI without Chrome APIs for rapid UI tweaks.
- `npm run build` compiles background/content/options into `build/`; load that folder via `chrome.exe --load-extension="D:\Program Files\Git\chatgpt-prompt-extension\build"` for end-to-end testing.
- `npm run lint` (optional) enforces ESLint/TypeScript rules.

## Coding Style & Naming Conventions
All runtime code is TypeScript. Use ES2020 features, prefer `const`, and keep React components functional with hooks. State setters live near their handlers; avoid inline functions in hot lists unless memoized. Follow the existing class naming (`camelCase` for helpers, kebab-case for CSS utility classes). DOM-sanitizing rules still apply: content scripts should only touch `textContent`/`innerText`, never `innerHTML`.

## Testing Guidelines
There is no automated suite—manual verification is mandatory. After `npm run build`, reload the unpacked extension, open https://chatgpt.com, type the trigger symbol (default `!!`), and confirm the suggestion box renders, keyboard navigation works, and prompts insert correctly. Exercise the React options page: add/edit/delete prompts, change triggers, import/export JSON, and check `chrome.storage.sync` via DevTools > Application to ensure data persists across reloads and matches multilingual input.

## Commit & Pull Request Guidelines
Keep commits small, imperative, and under 72 characters (`Refactor content observer`). Document behavioral changes plus manual test notes in the body. PRs should describe motivation, list UI/permission impacts, and attach before/after screenshots or short clips when the React UI changes. Reference related issues and call out any manifest or storage migrations so reviewers understand risk.

## Security & Configuration Tips
This extension only uses the `storage` permission and targets `https://chatgpt.com/*`; justify any expansion in your PR. Update `public/manifest.json` and `src/background.ts` together when adjusting action behavior. Icons under `public/icons/` must remain optimized PNGs. For resilience, normalize all prompt text (trim, dedupe) before writing to sync storage, and keep defaults in `background.ts` so fresh installs behave predictably.
