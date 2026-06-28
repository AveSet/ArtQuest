import { expect, test } from '@playwright/test'

test('first launch profile setup then quick tour entry', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'artquest-progress',
      JSON.stringify({
        schemaVersion: 15,
        skillNodes: [],
        legacySkills: [],
        achievements: [],
        userQuests: [],
        deletedQuestIds: [],
        completedQuests: [],
        completedWorks: [],
        questCompletionLogs: [],
        settings: {
          soundEnabled: false,
          soundVolume: 0.3,
          language: 'en',
          favoriteCategories: ['drawing', 'animation', 'anatomy'],
          useRandomCategories: false,
          profileSetupComplete: false,
          hasSeenOnboarding: false,
        },
      }),
    )
  })

  await page.goto('/#/')
  await expect(page.getByRole('heading', { name: /welcome to artquest/i })).toBeVisible({
    timeout: 20_000,
  })

  await page.getByRole('button', { name: /drawing/i }).first().click()
  await expect(page.getByRole('heading', { name: /how would you rate your level/i })).toBeVisible({
    timeout: 15_000,
  })
  await page.getByRole('button', { name: /continue/i }).click()
  await expect(page.getByText(/which art programs do you use/i)).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: /continue/i }).click()
  await page.getByRole('button', { name: 'Male', exact: true }).click()
  await expect(page.getByRole('dialog', { name: /welcome to artquest/i })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('button', { name: /skip tour/i })).toBeVisible()
})
