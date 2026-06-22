# Niki Lash Studio — Editorial Redesign

A redesign of a Chicago lash &amp; henna studio's website, rebuilt around the
studio's real brand identity with a working appointment-booking flow.

## The brief

The original site (Bootstrap, four pages) had a clear product idea buried under
execution problems: a hero pushed off-screen by oversized header padding, every
photo blurred by a global CSS filter, a "carousel" that reused one image three
times, two competing navigations, and — most importantly — no way to actually
book an appointment.

This redesign keeps the real business, content, and pricing, and elevates it.

## Design direction

- **Aesthetic:** sleek &amp; editorial — high-contrast, magazine-style layout.
- **Palette (from the studio logo):** navy `#2E3A5C`, brick red `#9E2B27`,
  blush `#F5E8E8`. The page runs a tonal arc from a light blush hero down to a
  deep navy footer.
- **Type:** Playfair Display (editorial display serif) paired with Inter
  (clean UI/body) — the tension between them carries the personality.
- **Signature element:** the four-step booking flow (service → stylist →
  date &amp; time → confirm) with a live-updating price total and clear,
  step-by-step validation.

## Structure

```
niki-lash-studio/
├── index.html        Home — hero, services preview, gallery, booking CTA
├── services.html     Full categorized menu with real pricing
├── book.html         Four-step booking flow
├── css/
│   └── style.css     Shared brand tokens + all component styles
├── js/
│   └── booking.js    Self-contained booking widget (NikiBooking.init)
└── README.md
```

## Running

It's static — open `index.html` in any browser, or serve the folder:

```
python3 -m http.server 8000
```
