# Index.html Structure & Coding Format Summary for Claude AI

The Tharaga homepage (`app/public/index.html`) is a static HTML file with inline CSS in `<style>` tags (lines 16-782), using CSS variables (`--primary: #1e40af`, `--gold: #d4af37`) and glassmorphic design (dark gradient body, fixed header with `backdrop-filter: blur(24px)`, hover shimmer effect).

Sections are static HTML (insert new content after line 1538) with `.inner` containers (`max-width:1100px`, `padding:0 16px`), responsive grids (`grid-template-columns:1fr` mobile → `repeat(3,1fr)` desktop at `@media (min-width:1024px)`), glassmorphic cards (`backdrop-filter: blur(10px)`, `rgba(255,255,255,0.72)`), and `.fade-up` reveal animations using IntersectionObserver.

Coding style: compressed CSS (no line breaks), inline media queries (`@media (max-width:767px)`), inline JavaScript at bottom, z-index layering (background: 0, sections: 1, header: 9999), breakpoints at 767px (mobile) and 1024px (desktop).
