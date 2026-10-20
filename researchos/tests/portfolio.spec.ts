import {mockGoogle,signIn} from "./google-mock";
import {test, expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

const dois = [
  '10.9734/jaeri/2026/v27i4766',
  '10.9734/ejnfs/2026/v18i52036',
  '10.9734/ajahr/2026/v13i2458',
  '10.9734/ijecc/2026/v16i45353',
  '10.26832/24566632.2026.110203',
  '10.9734/sajsse/2025/v22i121234',
  '10.9734/ejnfs/2025/v17i101886',
];

test.beforeEach(async ({page}) => {
  await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:4173/') ? route.continue() : route.abort());
  await mockGoogle(page);
});

test('academic identity, seven compact publication cards, five ongoing studies, and education match the supplied content', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', {name: 'Nasfiqul Islam Antu', exact: true})).toBeVisible();
  await expect(page).toHaveTitle('Nasfiqul Islam Antu | Transportation Engineering Researcher');
  await expect(page.locator('#greeting')).toContainText('Transportation Engineering Researcher');
  const portrait = page.locator('#greeting img.profile-image');
  await expect(portrait).toHaveAttribute('src', '/images/nasfiqul-islam-antu.png');
  expect(await portrait.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(page.locator('#publications article')).toHaveCount(7);
  for (const doi of dois) {
    const card = page.locator('#publications article').filter({has: page.locator('a.publication-read[href$="' + doi + '"]')});
    const link = card.getByRole('link', {name: 'Read Publication', exact: true});
    await expect(link).toHaveAttribute('href', new RegExp(doi.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'));
    await expect(card).toContainText('Islam, M. A.');
  }
  await expect(page.locator('#projects .project-card')).toHaveCount(5);
  await expect(page.locator('#projects .research-status')).toHaveCount(5);
  await expect(page.locator('#projects')).toContainText('5 Ongoing Research Projects');
  await expect(page.locator('#projects')).toContainText('Ongoing — Concept Development');
  await expect(page.locator('#projects')).toContainText('Ongoing — Exploratory Field Research');
  await expect(page.locator('#publications')).not.toContainText('DOI:');
  await expect(page.locator('#publications')).not.toContainText('European Journal');
  await expect(page.locator('#education')).toContainText('Islamic University of Technology (IUT)');
  await expect(page.locator('#education')).toContainText('Expected graduation: October 2027');
  await expect(page.locator('#education')).toContainText('Fourth Year, Seventh Semester');
  await expect(page.locator('#education')).not.toContainText('CGPA');
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/wanna be a Programmer|Wasting Time|Frontend\/Design|Cloud Me|Social Engineering|Preparing for HSC/);
  await expect(page.locator('.skill')).toHaveCount(7);
  expect(await page.locator('.skills-bar').innerText()).not.toMatch(/\d+%/);
  expect(errors).toEqual([]);
});

test('academic links, PDF download, existing themes, section layout and ResearchOS remain functional', async ({page}, testInfo) => {
  await page.goto('/');
  const heading = page.getByRole('heading', {name: 'Nasfiqul Islam Antu', exact: true});
  await expect(heading).toBeVisible();
  const event = page.waitForEvent('download');
  await page.getByRole('link', {name: 'Download CV', exact: true}).click();
  const download = await event;
  expect(download.suggestedFilename()).toBe('Md_Nasfiqul_Islam_Antu_CV.pdf');
  expect((await readFile((await download.path())!)).subarray(0, 5).toString()).toBe('%PDF-');
  await expect(page.locator('#greeting').getByRole('link', {name: 'LinkedIn', exact: true})).toHaveAttribute('href', 'https://linkedin.com/in/nasfiqul-antu');
  await expect(page.locator('#greeting').getByRole('link', {name: 'Google Scholar', exact: true})).toHaveAttribute('href', 'https://scholar.google.com/citations?user=Wtr485cAAAAJ');
  await expect(page.locator('#greeting').getByRole('link', {name: 'Email', exact: true})).toHaveAttribute('href', 'mailto:nasfiqul.antu@gmail.com');
  await page.evaluate(() => window.scrollTo({top: 0, behavior: 'instant'}));
  await expect(page.locator('header')).toBeInViewport();
  if (await page.locator('.menu-icon').isVisible()) await page.locator('.menu-icon').click();
  const toggle = page.getByRole('checkbox', {name: 'Toggle dark mode'});
  await page.locator(".switch").click();
  await expect(toggle).toBeChecked();
  await expect(page.locator('header')).toHaveClass(/dark-menu/);
  await expect(page.locator('.publication-card').first()).toHaveCSS('background-color', 'rgb(23, 28, 40)');
  await page.locator(".switch").click();
  await expect(toggle).not.toBeChecked();
  await expect(page.locator('.publication-card').first()).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.getByRole('link', {name: 'Publications', exact: true}).click();
  await expect(page).toHaveURL(/#publications$/);
  for (const section of ['greeting', 'skills', 'education', 'publications', 'projects', 'volunteering', 'contact']) {
    await page.locator('#' + section).scrollIntoViewIfNeeded();
    await page.waitForTimeout(1100);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  await expect(page.locator('#contact')).toContainText("Let's Connect");
  await expect(page.locator('#contact')).toContainText('nasfiqul.antu@gmail.com');
  const sectionOrder = await page.locator('#greeting, #skills, #education, #publications, #projects, #volunteering, #contact').evaluateAll(elements => elements.map(element => element.id));
  expect(sectionOrder).toEqual(['greeting', 'skills', 'education', 'publications', 'projects', 'volunteering', 'contact']);
  await page.locator('#greeting').scrollIntoViewIfNeeded();
  await page.screenshot({path: testInfo.outputPath('academic-portfolio.png')});
  // The original wave/reveal animations and original purple buttons remain.
  await expect(page.locator('.wave-emoji')).toHaveCSS('animation-name', 'wave');
  await expect(page.locator('#greeting .main-button').first()).toHaveCSS('background-color', 'rgb(85, 25, 139)');
  await page.goto('/researchos/');
  await signIn(page);
  await expect(page.getByRole('heading', {name: 'Good to see you back.'})).toBeVisible();
});
