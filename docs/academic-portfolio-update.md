# Academic portfolio content update

The supplied CV is the source for academic facts and publication metadata. The pasted requirements guide the content update. The portfolio remains a React 17 / Create React App site; ResearchOS remains available at `/researchos/` with its existing storage and import/export behavior. No framework, dependency, color palette or hosting changes were made.

## Content and design

- Hero: preferred display name, transportation research title, IUT introduction, professional portrait and a working Download CV action. The handwritten Antu Here header/splash signature, wave animation, reveal animation and existing button style remain.
- About/skills: academic biography, research interests, research tools and descriptive proficiency levels. The existing illustration and rounded skill bands remain; there are no invented percentages.
- Education: IUT, degree, fourth year/seventh semester, expected October 2027 graduation, and the corrected HSC/SSC records. Only school GPAs are displayed.
- Publications: the former GitHub repository-card section now presents all seven CV citations with complete titles, authors, year, journal, volume/issue, pages and DOI links. The supplied HAL link is retained. Card grid, light/dark colors, shadows, hover behavior and Fade animation remain. No publication counts beyond the seven supplied articles, citation metrics, abstracts, rankings or experimental results were invented.
- Research projects: the original project-card section presents the three ongoing studies, their activities, technologies and current progress. The lateral movement project explicitly remains in development with video collection scheduled; no completed findings or model accuracy are claimed.
- Contact/footer/metadata: updated email, academic profiles, researcher identity, portrait and browser/social metadata. The contact layout and original social icon treatment remain. The older GitHub biography/avatar is no longer fetched to populate current personal content.
- Section order is retained: greeting, About/skills, expertise, education, optional experience (still disabled), publications in the old repository-card position, research projects, contact, footer. Navigation keeps its original structure; Open Source is relabeled Publications. ResearchOS is retained.

CSS changes are limited to wrapping longer names and citations, fitting the extra CV action, avoiding a fixed-height portrait overlap on phones, and displaying descriptive labels in the existing skill bands. Existing accent/background colors, font families, animations, shadows and theme behavior remain.

## Assets and replacements

- `public/images/nasfiqul-islam-antu.png`: the professional portrait embedded in the supplied CV, visually matching the photograph attached in chat.
- `public/cv/Md_Nasfiqul_Islam_Antu_CV.docx`: the original supplied CV.
- `public/cv/Md_Nasfiqul_Islam_Antu_CV.pdf`: a two-page PDF converted with LibreOffice. Text extraction verified all seven DOI references and the final language section; the PDF contains link annotations.

Replace those stable filenames to update the portrait or CV. The website links to the PDF; the original DOCX is also retained. No official IUT logo or research photographs were provided. The IUT card uses initials in the existing rounded image position; research images are omitted rather than fabricated.

## Changed files

| Area | Files |
| --- | --- |
| Content | `src/portfolio.js`, `src/data/publications.js` |
| Hero / actions | `src/containers/greeting/Greeting.js`, `src/containers/greeting/Greeting.css`, `src/components/button/Button.js` |
| About / skills | `src/containers/skills/Skills.js`, `src/containers/skillProgress/skillProgress.js`, `src/containers/skillProgress/Progress.css` |
| Education | `src/components/educationCard/EducationCard.js`, `src/components/educationCard/EducationCard.css` |
| Publications | `src/containers/projects/Projects.js`, `src/containers/projects/Project.css` |
| Research cards | `src/containers/StartupProjects/StartupProject.js`, `src/containers/StartupProjects/StartupProjects.css` |
| Contact | `src/containers/profile/Profile.js`, `src/components/githubProfileCard/GithubProfileCard.js`, `src/components/socialMedia/SocialMedia.js` |
| Navigation / footer | `src/components/header/Header.js`, `src/components/ToggleSwitch/ToggleSwitch.js`, `src/components/footer/Footer.js` |
| Metadata | `public/index.html`, `public/manifest.json` |
| Assets | The three files listed above |
| Verification | `researchos/tests/portfolio.spec.ts`, `researchos/tests/workspace.spec.ts` (updated expected portfolio name) |
| Documentation | `docs/academic-portfolio-update.md` |

## Build, tests and deployment

Use the Node version in `.nvmrc` and the existing repository setup instructions. From the repository root:

```sh
npm run build
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:researchos -- --workers=2
```

The combined production build passed, and all **12 desktop/phone browser tests passed**. The tests serve the production build and cover the academic identity, all seven DOI links, three ongoing studies, education, portrait loading, CV PDF download, original purple buttons and wave animation, section order, light/dark switching, mobile layout and the existing ResearchOS workflows. Local browser tests exclude external fonts, analytics and third-party destinations. External DOI/profile links are copied from the CV; remote article availability is not established by these local checks. The original portfolio Jest suite's existing undeclared test dependencies are unchanged.

Additional browser checks exercised 320px, 390px, 768px, 1024px and 1440px widths and found no horizontal overflow or JavaScript page errors.

The existing `npm run deploy` command preserves generated profile data, builds both applications, and publishes the complete `build/` directory to `gh-pages`. Source changes belong on `master`. GitHub Pages can take a few minutes to serve a new deployment. Direct live-site verification may be unavailable from the restricted cloud network; published branch files can still be verified against the build.
