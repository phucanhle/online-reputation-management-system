<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
# System Design Lock: Antigravity Guidelines

This file serves to lock the design parameters for this workspace.

## 1. Core Technologies
- Structure & Logic: HTML and TypeScript (via React/Next.js where applicable).
- Styling: **TailwindCSS**. Use Tailwind utility classes directly to execute rapid responsive design, prioritizing dynamic transitions and modern styling techniques.

## 2. Aesthetic Requirements
- **NO Basic/Plain UI:** Must wow the user. Generic colors (plain red, blue, green) and default aesthetics are unacceptable.
- **Color Palette:** Curated, harmonious colors. Lean towards modern aesthetics like sleek dark modes, vibrant pops of color, and high legibility.
- **Typography:** Utilize modern typography (e.g., Google Fonts like Inter, Roboto, or Outfit) to replace default browser fonts.
- **Visual Styles:** Smooth gradients and glassmorphism.

## 3. Dynamic Elements & Interactivity
- Provide rich hover state changes.
- Incorporate subtle micro-animations (e.g. slight scaling or background transition on hover) for interactive elements to make the interface responsive and engaging.

## 4. Workflows & Assembly
1. Establish design system tokens inside `index.css` (or `globals.css`).
2. Compose components using defined styles.
3. Build complete pages maintaining consistent spacing, typography, and responsive layouts.
4. Finalize with SEO best practices (semantic HTML, correct headers, unique tracking IDs). 
