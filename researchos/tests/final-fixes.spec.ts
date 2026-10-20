import {test, expect} from '@playwright/test';

test.beforeEach(async ({page}) => {
  await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:4173/') ? route.continue() : route.abort());
});

test('publication titles and authors have readable contrast in both themes', async ({page}, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('heading', {name: 'Nasfiqul Islam Antu', exact: true})).toBeVisible();
  if (await page.locator('.menu-icon').isVisible()) await page.locator('.menu-icon').click();
  await page.locator('.switch').click();
  const cards = page.locator('#publications article');
  await expect(cards).toHaveCount(7);
  await expect(cards.first().locator('.publication-title')).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(cards.first().locator('.publication-title a')).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(cards.first().locator('.publication-authors')).toHaveCSS('color', 'rgb(217, 219, 223)');
  await expect(cards.first().locator('.publication-year')).toHaveText('2026');
  await expect(cards.first().getByRole('link', {name: 'Read Publication', exact: true})).toHaveAttribute('rel', 'noopener noreferrer');
  await page.locator('#publications').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1100);
  await page.screenshot({path: testInfo.outputPath('publications-dark.png')});
  expect(await page.locator('.publication-title').first().evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await page.evaluate(() => window.scrollTo({top: 0, behavior: 'instant'}));
  await page.locator('.switch').click();
  await expect(cards.first().locator('.publication-title a')).toHaveCSS('color', 'rgb(36, 41, 46)');
});

test('research illustration, five honest scopes and volunteering details render without broken image requests', async ({page}) => {
  const brokenImages: string[] = [];
  page.on('response', response => {
    if (response.request().resourceType() === 'image' && response.status() >= 400) brokenImages.push(response.url());
  });
  await page.goto('/');
  await expect(page.getByRole('heading', {name: 'Nasfiqul Islam Antu', exact: true})).toBeVisible();
  const illustration = page.getByRole('img', {name: /Engineering researcher reviewing traffic video/});
  await page.locator('.skills-image-div').scrollIntoViewIfNeeded();
  await expect(illustration).toHaveAttribute('src', '/images/transportation-research.png');
  await expect(illustration).toBeVisible();
  expect(await illustration.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  const cards = page.locator('#projects article');
  await expect(cards).toHaveCount(5);
  const emergency = cards.filter({hasText: 'Emergency Vehicle Accessibility'});
  await emergency.getByText('Research Details', {exact: true}).click();
  await expect(emergency).toContainText('Proposed research activities');
  await expect(emergency).toContainText('Methods under consideration');
  await expect(emergency).toContainText('Concept development and methodology exploration.');
  const curbside = cards.filter({hasText: 'Curbside Occupancy and Traffic Disruption'});
  await curbside.getByText('Research Details', {exact: true}).click();
  await expect(curbside).toContainText('Potential indicators');
  await expect(curbside).toContainText('Following vehicle response');
  await expect(page.locator('#volunteering')).toContainText('BB Mobile School');
  await expect(page.locator('#volunteering')).toContainText('Co-founder & Volunteer');
  await expect(page.locator('#volunteering .volunteering-gallery figure')).toHaveCount(2);
  await expect(page.getByRole('link', {name: 'Visit Organization', exact: true})).toHaveAttribute('href', 'https://www.facebook.com/BB.MobileSchool');
  await expect(page.getByRole('link', {name: 'Visit Organization', exact: true})).toHaveAttribute('rel', 'noopener noreferrer');
  for (const id of ['projects', 'volunteering']) {
    await page.locator('#' + id).scrollIntoViewIfNeeded();
    await page.waitForTimeout(1100);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  // Missing originals stay explicit in this draft; media readiness is checked
  // separately by npm run check:media and currently blocks publication.
  await expect(page.locator('#projects .portfolio-image-pending')).toHaveCount(5);
  await expect(page.locator('#volunteering .portfolio-image-pending')).toHaveCount(2);
  expect(brokenImages).toEqual([]);
});
