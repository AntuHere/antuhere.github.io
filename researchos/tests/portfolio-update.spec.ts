import {test, expect} from '@playwright/test';

test('compact expertise, IWM training and eight GitHub projects work in both themes', async ({page}, info) => {
  await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:4173/') ? route.continue() : route.abort());
  await page.goto('/');
  await expect(page.getByRole('heading', {name: 'Nasfiqul Islam Antu', exact: true})).toBeVisible();
  await expect(page.locator('#expertise .expertise-card')).toHaveCount(7);
  await expect(page.locator('#expertise .meter')).toHaveCount(0);
  await expect(page.locator('#training')).toContainText('Trainee Engineer (Academic Intern)');
  await expect(page.locator('#training time').last()).toHaveAttribute('dateTime', '2026-10-04');
  const repos = ['rickshaw-behavior-analysis', 'Slab-Design', 'Earthquake-Prediction', 'EDA-ML-Tool---python', 'BeamAnalysis', 'facebookPhising', 'cloud-mee', 'Sorting-Visualizer'];
  await expect(page.locator('#github-projects article')).toHaveCount(repos.length);
  await expect(page.locator('#github-projects img')).toHaveCount(8);
  await expect(page.locator('header a[href="/researchos/"]')).toHaveCount(0);
  for (const repo of repos) await expect(page.locator('#github-projects a[href="https://github.com/AntuHere/' + repo + '"]')).toHaveCount(1);
  for (const theme of ['light', 'dark']) {
    await page.evaluate(theme => localStorage.setItem('isDark', JSON.stringify(theme === 'dark')), theme);
    await page.reload();
    await page.addStyleTag({content: "html, body { scroll-behavior: auto !important; }"});
    await expect(page.getByRole('heading', {name: 'Skills & Expertise'})).toHaveCount(1);
    for (const section of ['expertise', 'training', 'github-projects']) {
      await page.locator('#' + section).evaluate(element => element.scrollIntoView({block: 'start', behavior: 'instant'}));
      await page.screenshot({path: info.outputPath(section + '-' + theme + '.png')});
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    for (const image of await page.locator('#github-projects img').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    }
    await page.evaluate(() => window.scrollTo({top: 0, behavior: 'instant'}));
    if (await page.locator('.menu-icon').isVisible()) await page.locator('.menu-icon').click();
    await page.locator('header a[href="#training"]').click();
    await expect(page).toHaveURL(/#training$/);
    await page.evaluate(() => window.scrollTo({top: 0, behavior: 'instant'}));
    await expect(page.locator('header a[href="#github-projects"]')).toBeInViewport();
    await page.locator('header a[href="#github-projects"]').click();
    await expect(page).toHaveURL(/#github-projects$/);
  }
});
