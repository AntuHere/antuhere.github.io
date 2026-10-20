# Final portfolio content and UI fixes

This update preserves the existing React framework, fonts, navy/purple palette, navigation, card styles and reveal animations. ResearchOS and the supplied CV remain available. No dependencies, database or paid services were added.

## Completed changes

- Replaced the programming illustration with an original transparent transportation research illustration: a researcher reviews traffic detections and trajectories on a laptop, with road geometry, papers and charts. It uses the existing illustration slot and Fade reveal; subtle motion respects reduced-motion preferences.
- Added all five supplied research scopes and their accurate stages. Emergency accessibility remains concept development and methodology exploration; curbside occupancy remains exploratory field research. Full overviews, research questions, proposed activities and potential indicators are available inside the existing project cards via Research Details. No completed experiments, validated models, results or accuracy metrics were invented.
- Updated visible research counts to five and retained seven publications.
- Fixed publication titles to use readable light text in the dark theme. Authors use soft gray, years use small metadata, and cards display only title, authors, year and Read Publication. Full bibliographic metadata remains unchanged in `src/data/publications.js`; the links still use the supplied DOI/publisher URLs. Existing backgrounds, shadows and hover effects remain. The compact grid uses three columns on large screens, two on medium screens and one on phones.
- Replaced the IUT initials with the original university emblem supplied in the ZIP. It occupies the existing education badge position and uses `object-fit: contain`, with no circular clipping. The complete emblem and lettering are preserved. Its original white background is retained to avoid damaging the emblem.
- Added Volunteering & Leadership before Contact: BB Mobile School, Co-founder & Volunteer, the supplied description and Visit Organization link to `https://www.facebook.com/BB.MobileSchool` with safe external-link attributes. No founding dates, beneficiary counts or achievements were invented.
- Included all three BB Mobile School assets from the ZIP: the organization logo, volunteer group photograph and Find Educate Build team banner. The gallery presents photos side by side on desktop and stacks them on phones. Full frames and natural aspect ratios are retained; no faces, banners or organizational marks are cropped, and no dark overlays are applied.

## Supplied assets

| Local asset | Source from the uploaded ZIP | Handling |
| --- | --- | --- |
| `public/images/iut-logo.png` | `ChatGPT Image Oct 20, 2026, 06_11_01 PM.png` | Original 447 × 732 PNG, unchanged |
| `public/images/bb-mobile-school-logo.jpg` | `730530203_2314778115718534_772908432124417798_n.jpeg` | Original 890 × 890 JPEG, unchanged |
| `public/images/bb-mobile-school-volunteers.webp` | `ChatGPT Image Oct 20, 2026, 06_11_09 PM.png` | Lossless WebP, original 1280 × 825 dimensions |
| `public/images/bb-mobile-school-banner.webp` | `ChatGPT Image Oct 20, 2026, 06_11_12 PM.png` | Lossless WebP, original 820 × 312 dimensions |
| `public/images/transportation-research.png` | Original illustration generated for this update | Transparent illustration, not a research photograph |

Decoded RGB pixels of both WebP files were compared against the source PNGs and matched exactly. Encoding reduces the combined photo/banner payload from about 2.16 MB to 1.29 MB without changing the photographs.

## Research photographs deferred by the owner

The owner explicitly requested that research photographs be added later. The five research cards currently render as text cards without empty image containers, broken images or pending-photo messages. This does not block deployment.

`src/data/portfolioMedia.json` retains five optional image entries for later use:

- Rickshaw stopping: `rickshaw-stopping.webp`
- Mixed traffic / lateral movement: `mixed-traffic.webp`
- Road construction waste: `road-construction-waste.webp`
- Emergency accessibility: `emergency-access.webp`
- Curbside occupancy: `curbside-occupancy.webp`

To add a photo, place it in `public/images/` and set its entry's `src`, `width` and `height`. The card then renders it in a consistent 16:9 frame using `object-fit: cover`, lazy loading, and descriptive alt text. For external photographs, verify licensing and populate the optional source/credit/license metadata. No external research photographs have been downloaded or substituted. The earlier Wikimedia access draft is not needed for the current release.

`npm run check:media` requires the university, organization, volunteering and illustration assets, and accepts the five deliberately deferred research photographs. A configured image path must resolve to an existing local file, including optional photos once supplied.

## Changed files

- `src/data/researchProjects.js`, `src/data/portfolioMedia.json`, `src/portfolio.js`: five research scopes, asset metadata and volunteering content.
- `src/containers/skills/Skills.js`, `Skills.css`: relevant research illustration.
- `src/containers/projects/Projects.js`, `Project.css`: compact and readable publications.
- `src/containers/StartupProjects/StartupProject.js`, `StartupProjects.css`: project scopes, disclosures and optional uniform images.
- `src/components/portfolioImage/PortfolioImage.js`, `PortfolioImage.css`: shared accessible local-image rendering and attribution; absent optional photos render nothing.
- `src/components/educationCard/EducationCard.js`, `EducationCard.css`: full IUT emblem in the original position.
- `src/containers/volunteering/Volunteering.js`, `Volunteering.css`, `src/containers/Main.js`: organization identity, gallery and section placement.
- `public/images/`: the five assets listed above.
- `scripts/check-portfolio-media.cjs`, `package.json`: required asset check before deployment.
- `researchos/tests/portfolio.spec.ts`, `researchos/tests/final-fixes.spec.ts`: academic content, contrast, current counts, real image loading, disclosures and responsive gallery verification.
- `docs/final-portfolio-fixes.md`: this implementation and maintenance report.

## Verification and deployment

From the repository root, use the pinned Node 22 version:

```sh
npm run check:media
npm run build
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:researchos -- --workers=2
```

The combined production build, required-media check and all **16 desktop/phone browser tests passed**. Browser checks exercise desktop and phone layouts, publication contrast in both themes, compact visible fields, correct publication URLs, all five honest scopes, new illustration loading, full IUT emblem loading and contain fit, organization identity and both photos, gallery aspect ratios, no empty research photo slots, CV PDF download, no horizontal overflow and the existing ResearchOS workflows. External fonts, analytics and third-party destinations are excluded from local browser checks. The original portfolio Jest suite's pre-existing undeclared test dependencies are unchanged.

The existing `npm run deploy` command runs the media check, preserves generated profile data, builds both applications and publishes the entire `build/` directory to `gh-pages`. GitHub Pages can take a few minutes to serve the update. The public site can be checked directly only when the execution environment permits access to its domain; published files can be verified against the build via Git.
