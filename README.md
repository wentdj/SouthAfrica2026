# South Africa 2026

Mobile-first, static safari itinerary built with Next.js, Tailwind CSS, and Lucide icons.

## Local development

```bash
npm install
npm run dev
```

The itinerary is read from `safari_itinerary.json` at build time. Update that file, then rebuild or redeploy to publish changes.

## GitHub Pages

The production configuration is set for this repository at `https://wentdj.github.io/SouthAfrica2026/`.

1. Push this project to the `master` branch of `wentdj/SouthAfrica2026`.
2. In GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. The included deployment workflow builds the static `out/` folder and deploys it on every push to `master`.

`npm run build` produces the static export locally.

## Privacy

The published app redacts confirmation codes, PINs, and booking references before static page data reaches the browser. The original JSON source remains unchanged, so do not make the repository public if its raw source data should be confidential.
