# Style Guide

## UI

- Use Tailwind utility classes only; no inline styles
- Apply glassmorphic gradient backgrounds on all pages
- Use `HoloCard`, `HoloButton`, `HoloText` patterns where suitable

## Animation

- Use Framer Motion (`motion.*`, variants) for transitions

## Code

- Strict TypeScript, no `any`
- Services validate inputs/outputs with Zod (required, not optional)
- Function components + hooks only; no class components
- All third-party calls stay in `services/`; components never `fetch()` external APIs
- No mocks/placeholders/TODOs or commented-out code in production paths

## Accessibility

- Focus states, keyboard nav, ARIA roles, sufficient contrast
