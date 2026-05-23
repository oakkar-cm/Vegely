# Vegely — Healthy Food Delivery, Singapore

A modern, responsive **static** website for **Vegely**, a fictional Singapore-based healthy
food delivery startup. Built for a university startup business assignment.

> Premium UI inspired by Dribbble and Apple-style layouts. Clean white background,
> green accents, soft shadows, glassmorphism, elegant typography — and zero CMS.

## Tech stack

- **HTML5** semantic markup
- **CSS3** with custom design tokens & utilities (`css/style.css`)
- **Bootstrap 5.3** (loaded via CDN — no build step required)
- **Bootstrap Icons 1.11** (CDN)
- **Vanilla JavaScript** for sticky nav, fade-in scroll animations, cart counter,
  category filter, contact form, newsletter form (`js/script.js`)
- **Google Fonts** — Poppins (display) + Inter (body)

No bundler, no framework, no CMS. Just open the HTML files in a browser or serve them
with any static server.

## Pages

| File           | Purpose                                                                   |
| -------------- | ------------------------------------------------------------------------- |
| `index.html`   | **Home** — Hero, special dishes, why-us features, membership banner       |
| `menu.html`    | **Menu** — Filterable food catalog: bowls / salads / protein / smoothies  |
| `about.html`   | **About / Contact** — Story, mission, team, why us, reviews, form, map    |

## Folder structure

```
.
├── index.html
├── menu.html
├── about.html
├── README.md
├── css/
│   └── style.css           # full custom theme on top of Bootstrap
├── js/
│   └── script.js           # sticky nav, fade-up, filters, cart, forms
└── images/
    ├── README.md           # how to swap CDN images for local files
    ├── hero/
    ├── dishes/
    ├── team/
    └── icons/
        └── favicon.svg
```

## Running locally

The site is fully static. The simplest way to view it:

1. Open `index.html` directly in a browser, **or**
2. Serve the folder with any static HTTP server, for example:

   ```bash
   # Python 3
   python -m http.server 5500

   # Node
   npx serve -p 5500
   ```

   Then visit `http://localhost:5500/`.

## Brand & design

- **Primary green:** `#5FAE4B` (`--vg-green-500` in `css/style.css`)
- **Background:** layered cream (`#FDFCF7` → `#FAF8F1`) with subtle radial green washes
- **Type:** Poppins (headings) + Inter (body)
- **Surfaces:** glassmorphism cards with `backdrop-filter: blur()` + soft drop-shadows
- **Buttons:** rounded-full with green glow shadow + animated pulse on the membership CTA
- **Animations:** fade-up on scroll (IntersectionObserver), floating hero leaves, slow-spinning
  dashed orbit, ping fresh-dot on hero badge

To recolor the entire site, change the `--vg-green-*` CSS variables in `:root`.

## What's interactive

- Sticky translucent navbar that gains a soft shadow on scroll
- Mobile hamburger drawer
- Smooth scrolling between sections (`html { scroll-behavior: smooth }`)
- Fade-up animations on every section as it enters the viewport
- **Add to cart** buttons increment the navbar bag chip and pop a toast
- **Menu page**: pill tabs filter dishes by category (`all`, `bowls`, `salads`, `protein`, `smoothies`)
- **Contact form**: validated, intercepts submit and shows a success toast
- Newsletter forms in the footer of every page

## Assignment talking points

The site is structured to clearly explain a startup idea:

- **Problem & promise** in the hero copy
- **Product** demonstrated by the special dishes + full menu page
- **Differentiation** in the "Why Vegely" features and "Why Choose Us"
- **Team & story** on the About page (founder, chef, nutritionist, ops lead)
- **Social proof** via testimonials, "as featured in" strip, and 12,400+ customer count
- **Business model hook** in the membership banner ("50% off your first month")
- **Local context** through Singapore-specific copy, addresses, +65 phone, S$ pricing,
  and an embedded Google Maps placeholder of the Marina Boulevard HQ

## Credits

Food and people photography is hot-linked from [Unsplash](https://unsplash.com) for
convenience. Replace with your own photos for production by following
`images/README.md`.
