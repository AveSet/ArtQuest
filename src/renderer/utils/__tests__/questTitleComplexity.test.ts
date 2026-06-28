import { describe, it, expect } from 'vitest'

import animationCatalog from '@/data/quests_animation.json'

import drawingCatalog from '@/data/quests_drawing.json'

import environmentCatalog from '@/data/quests_environment.json'

import type { Quest } from '@/store/models'

import {

  assessTitleComplexity,

  getTitleComplexityHints,

  metricsFromComplexityProfile,

} from '../questTitleComplexity'

import { estimateQuestMetrics } from '../questMetricsEstimator'



const animation = animationCatalog as Quest[]

const drawing = drawingCatalog as Quest[]

const environment = environmentCatalog as Quest[]



describe('assessTitleComplexity', () => {

  it('rates two-person dance animation as high complexity', () => {

    const p = assessTitleComplexity('анимировать танец двух людей', 'animation')

    expect(p.score).toBeGreaterThanOrEqual(15)

    expect(['advanced', 'expert', 'master']).toContain(p.minDifficulty)

    expect(p.inferredTags.length).toBeGreaterThan(0)

  })



  it('rates simple warm-up lower', () => {

    const p = assessTitleComplexity('быстрая разминка линий', 'drawing')

    expect(p.score).toBeLessThan(11)

    expect(p.minDifficulty).toBe('novice')

  })



  it('recognizes catalog-style colon titles', () => {

    const p = assessTitleComplexity('Цикл ходьбы: вес и перенос', 'animation')

    expect(p.minDifficulty).not.toBe('novice')

    expect(p.score).toBeGreaterThan(10)

  })



  it('rates matte painting environment work highly', () => {

    const p = assessTitleComplexity('Матовая живопись: город на закате', 'environment')

    expect(['advanced', 'expert', 'master']).toContain(p.minDifficulty)

  })



  it('rates production brief as expert-tier', () => {

    const p = assessTitleComplexity('Industry brief: portfolio final', 'storytelling')

    expect(['expert', 'master']).toContain(p.minDifficulty)

  })

})



describe('getTitleComplexityHints', () => {

  it('returns localized hints for dance brief', () => {

    const ru = getTitleComplexityHints('анимировать танец двух людей', 'animation', 'ru')

    const en = getTitleComplexityHints('animate a dance for two people', 'animation', 'en')

    expect(ru.length).toBeGreaterThan(0)

    expect(en.length).toBeGreaterThan(0)

  })

})



describe('estimateQuestMetrics', () => {

  it('assigns advanced+ rewards for two-person dance', () => {

    const m = estimateQuestMetrics('анимировать танец двух людей', animation, 'animation')

    expect(m.xp).toBeGreaterThan(120)

    expect(m.estimatedTime).toBeGreaterThan(50)

    expect(['advanced', 'expert', 'master']).toContain(m.difficulty)

  })



  it('matches walk cycle neighbors via synonyms', () => {

    const m = estimateQuestMetrics('цикл ходьбы персонажа', animation, 'animation')

    expect(m.xp).toBeGreaterThan(70)

    expect(m.matchScore).toBeGreaterThan(0.15)

  })



  it('scales drawing silhouette above novice drills', () => {

    const m = estimateQuestMetrics('Силуэт: динамичная поза', drawing, 'drawing')

    expect(m.xp).toBeGreaterThan(60)

  })



  it('uses environment calibration for matte brief', () => {

    const m = estimateQuestMetrics('matte painting fantasy castle', environment, 'environment')

    expect(m.estimatedTime).toBeGreaterThan(45)

    expect(['intermediate', 'advanced', 'expert', 'master']).toContain(m.difficulty)

  })

})



describe('metricsFromComplexityProfile calibration', () => {

  it('uses per-category XP bands', () => {

    const profile = assessTitleComplexity('Матовая живопись большого города', 'environment')

    const metrics = metricsFromComplexityProfile(profile, 'environment', 1, {

      xp: 100,

      estimatedTime: 46,

      difficulty: 'intermediate',

    })

    expect(metrics.xp).toBeGreaterThan(100)

  })

})


