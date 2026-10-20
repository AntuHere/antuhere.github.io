# Final portfolio fixes — draft awaiting original media

This increment preserves the existing React framework, fonts, navy/purple palette, navigation, section styling and reveal animations. ResearchOS and the supplied CV files are unchanged.

## Implemented

- Replaced the programming illustration with an original, transparent transportation research illustration. The researcher studies vehicle detections and trajectories on a laptop, with road geometry, papers and charts. It occupies the existing illustration slot and retains the section's Fade reveal with a subtle motion effect that respects reduced-motion preferences.
- Added all five owner-supplied project scopes and accurate progress labels. The emergency-access project remains concept/methodology exploration; curbside research remains exploratory. Full overviews, questions, activities and potential indicators are available inside each card's Research Details disclosure. No completed studies, validated models, findings or results are invented.
- Added one uniform 16:9 image slot per project with lazy image loading, descriptive alt text, optional source/license attribution, and local asset paths. No unlicensed editorial images or synthetic research photos are substituted.
- Fixed dark publication titles with an explicit scoped light color. Authors use softer gray, years use smaller text, and cards display only title, authors, year and Read Publication. Complete journal, volume, issue, pages, DOI and HAL metadata remain unchanged in `src/data/publications.js`. Links still resolve to the supplied DOI URLs. The existing card backgrounds, shadows and hover effect remain; the grid is three columns on large screens, two on medium screens and one on phones.
- Prepared the IUT logo path and `object-fit: contain` styling in the existing badge position. Proportions are preserved and circular cropping is removed for this logo only. The old initials remain until the original logo file is accessible.
- Added Volunteering & Leadership immediately before Contact: BB Mobile School, Co-founder & Volunteer, the exact supplied description, two natural-ratio photo slots and the safe Facebook external link. Photos sit alongside each other on desktop and stack on phones, without cropping or overlays.
- Updated visible portfolio research counts to five and retained seven publications.

## Required media — not completed

The six images in the chat are visible to the assistant, but the original image files are not exposed to the download/file tools. Only the pasted request was provided as a downloadable attachment. No logo or volunteering photos were found in the checkout or accessible attachment directories. Those images cannot be copied pixel-for-pixel from the inline message using the available tools.

Five project-specific research photos were not supplied. Requests to Wikimedia Commons, its upload host and the university's website return HTTP 403 from this environment's network proxy. No licensed replacement photos have been downloaded or verified.

The following **eight required assets remain absent**:

| Key in `src/data/portfolioMedia.json` | Expected filename | Needed content |
| --- | --- | --- |
| iutLogo | `iut-logo.png` | The supplied official IUT emblem |
| rickshaw | `rickshaw-stopping.webp` | Rickshaw passenger boarding/alighting or stopping in Dhaka |
| lateral | `mixed-traffic.webp` | Elevated heterogeneous traffic view or properly sourced trajectory visualization |
| waste | `road-construction-waste.webp` | Road construction/demolition debris beside a roadway |
| emergency | `emergency-access.webp` | Ambulance navigating congested mixed urban traffic |
| curbside | `curbside-occupancy.webp` | Rickshaw curbside occupancy or bus boarding/stopping in Dhaka |
| volunteerGroup | `bb-mobile-school-volunteers.webp` | The original supplied volunteer group photograph |
| volunteerBanner | `bb-mobile-school-banner.webp` | The original supplied BB Mobile School / Find Educate Build banner |

Original files can be uploaded together as a ZIP, without renaming them. They will be optimized, placed in `public/images/`, and registered in the media dataset. Preserve the emblem's lettering and the photographs' faces; do not recreate these originals with image generation. Unnecessary outer white margins on the logo can be removed only if the emblem is not damaged. Keep gallery photos at their natural ratios.

If sourcing the five research images externally, activate the saved Wikimedia network additions, inspect each file's licensing and attribution requirements, retain its source and license in the media dataset, and label contextual photos without implying they are actual study frames. Original research photos may be supplied instead.

The configuration draft now requests `commons.wikimedia.org` and `upload.wikimedia.org`, preserving the selected package-manager preset. Saving that draft did not activate or publish the network configuration. Review/save it in environment settings, then publish the environment before retrying the blocked downloads.

The draft UI has explicit pending-image slots. `npm run check:media` currently fails for the eight missing originals, and `predeploy` runs that check so incomplete image slots cannot accidentally replace the live portfolio. Deployment has not been run for this increment.

## Changed files

- `src/data/researchProjects.js`: five full scopes and progress labels.
- `src/data/portfolioMedia.json`: original-image paths, alt text and future license credits.
- `src/portfolio.js`: five-project count, logo configuration and volunteering content.
- `src/containers/skills/Skills.js`, `Skills.css`: relevant illustration in the existing slot.
- `public/images/transportation-research.png`: original generated illustration, not a research photograph.
- `src/containers/projects/Projects.js`, `Project.css`: compact readable publications.
- `src/containers/StartupProjects/StartupProject.js`, `StartupProjects.css`: project image slots and detailed scope disclosures.
- `src/components/portfolioImage/PortfolioImage.js`, `PortfolioImage.css`: accessible shared local image/credit rendering.
- `src/components/educationCard/EducationCard.js`, `EducationCard.css`: optional full emblem fit.
- `src/containers/volunteering/Volunteering.js`, `Volunteering.css`, `src/containers/Main.js`: volunteering section.
- `scripts/check-portfolio-media.cjs`, `package.json`: required asset validation before deployment, without adding dependencies.
- `researchos/tests/portfolio.spec.ts`, `researchos/tests/final-fixes.spec.ts`: updated current-content and targeted UI checks.
- `docs/final-portfolio-fixes.md`: this status and asset handoff.

## Validation

The combined production build passes. All 16 desktop/phone browser checks have passed across the main run (14) and the affected-test rerun (2). The rerun scrolls to the stationary illustration container so it can validate the intentionally animated image. Browser checks cover publication contrast in both themes, compact visible fields, DOI destinations, five accurate scopes, the new illustration, Research Details disclosures, volunteering content/link, gallery slots, phone overflow and the existing CV/ResearchOS workflows. Pending-image checks validate draft behavior only; they do not establish photo or logo readiness. `npm run check:media` remains a failing release prerequisite until the real assets are supplied.

Once images are available, verify natural image dimensions and loading, licensing credits, five distinct project photos, both exact volunteering originals and the full IUT emblem. Rerun the affected checks and the media gate, then use the existing `npm run deploy` workflow. Do not publish placeholders or describe the image-dependent requirements as complete.
