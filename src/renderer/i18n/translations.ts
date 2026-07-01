export type { Language, LocalizedString } from './languages'
export { LANGUAGES, LANGUAGE_LABELS, isLanguage } from './languages'
import type { Language } from './languages'

export interface Translations {
  nav: {
    home: string
    quests: string
    gallery: string
    skills: string
    statistics: string
    resources: string
    achievements: string
    progress: string
    settings: string
    more?: string
    primaryNav?: string
  },
  progress: {
    title: string
    timeline: string
    calendar: string
    totalCompleted: string
    currentStreak: string
    bestStreak: string
    practiceStreak: string
    practiceStreakBest: string
    avgPerWeek: string
    days: string
    questsOnDate: string
    noCompletions: string
    completedOn: string
    goals: string
    goalsEmpty: string
    goalCompletedOn: string
    goalStartedOn: string
  },
  portrait: {
    settingsTitle: string
    settingsHint: string
    genderMale: string
    genderFemale: string
    chestHint: string
    rewardStarsLabel: string
    streakShieldAvailable: string
    streakShieldUsed: string
    streakShieldUsedThisMonth: string
    streakShieldLabel: string
    customAvatarCropTitle: string
    customAvatarCropHint: string
    customAvatarConfirm: string
    customAvatarDoubleClickHint: string
    customAvatarClickHint?: string
    customAvatarZoomIn: string
    customAvatarZoomOut: string
  },
  common: {
      back: string
      details: string
      completed: string
      startQuest: string
      cancel: string
      submit: string
      save: string
      selectFile: string
      complete: string
      allQuests: string
      xp: string
      minutes: string
      category: string
      source: string
      difficulty: string
      timeRemaining: string
      pauseQuest: string
      resumeQuest: string
      resetProgress: string
      cancelConfirm: string
      resetConfirm: string
      resetSuccess: string
      noQuestsFound: string
      /** Hint when filters yield no quests */
      noQuestsHint: string
      /** Lazy route / chunk loading */
      loadingRoute: string
      /** Initial bootstrap before stores hydrate */
      appLoading: string
      loading: string
      questsLoadError: string
      questNotFound: string
      confirm: string
      open: string
      close: string
      previousPage: string
      nextPage: string
      removeUpload: string
      abandonQuestTitle: string
      abandonQuestBody?: string
      attachmentRequired: string
      submitFailed: string
      submitFailedSave: string
      submitAlreadyCompleted?: string
      submitPartialUpload?: string
      submitStorageFull?: string
      gotIt?: string
      continue?: string
      retry?: string
      secondsAbbr?: string
    }
  a11y: {
    skipToMain: string
    mainNavigation: string
    appHome: string
    questCard: string
    difficultyBadge: string
    questActions: string
    viewQuestDetails: string
    questCompletedStatus: string
    startQuestNamed: string
    zoneMap: string
    uploadPreviewVideo: string
  }
  difficulty: {
    novice: string
    intermediate: string
    advanced: string
    master: string
    expert: string
    all: string
  }
  skills: {
    title: string
    level: string
    maxXp: string
    available: string
    in_progress: string
    review: string
    mastered: string
    start_practice: string
    repeat: string
    interval: string
    days: string
    practiceElapsed: string
    pausePractice: string
    resumePractice: string
    endPractice: string
    practiceHint: string
    practiceInProgress: string
    practiceComplete: string
    requires: string
    resources: string
    nodeMasteredHint?: string
    maxPrestigeReached?: string
    activePractice?: string
    practiceMinimizedHint?: string
    practiceMinArtAppHint?: string
    practiceArtAppPausedHint?: string
    collapseToWidget?: string
    practiceConfirmTitle?: string
    practiceConfirmMessage?: string
    cancelPractice?: string
    emptyHint?: string
    emptyCta?: string
    nextUnlock?: string
    nextPracticeHint?: string
    stretchReminderTitle?: string
    stretchReminderBody?: string
  }
  resources: {
    title?: string
    allCategories: string
    skillNode: string
    allNodes: string
    tag: string
    allTags: string
    search: string
    searchPlaceholder: string
    noResults: string
    openBrowser: string
    partnerChannels: string
    partnerChannelsHint: string
    libraryStats: string
    /** Personal Materials library */
    myLibrary: string
    myLibraryHint: string
    addYourLink: string
    linkUrl: string
    linkUrlPlaceholder?: string
    linkTitleOptional: string
    customLinkTitlePlaceholder?: string
    addLink: string
    removeLink: string
    invalidUrl: string
    catalogVideos: string
    favoriteAdd: string
    favoriteRemove: string
    addVideoNodeRequired: string
    nodeYoutubeSearchTitle?: string
    contextTags?: string
    searchPrefix?: string
    catalogLoading?: string
    catalogExtendedLoading?: string
    catalogLoadError?: string
    catalogFiltering?: string
    catalogMatchCount?: string
    catalogVirtualScrollHint?: string
    loadMoreVideos?: string
    addVideoYoutubeOnly: string
    addingVideo: string
    addVideoPanelIntro: string
    legacyImportedLinks: string
    legacyLinkBadge: string
    catalogCoreTitle?: string
    catalogMoreTitle?: string
    showMoreMaterials?: string
    videoModeLong?: string
    videoModeShort?: string
    videoModeClipTips?: string
    videoModeSketchfab?: string
    videoModePinterest?: string
    clipTipsOpenHint?: string
    sketchfabOpenHint?: string
    pinterestOpenHint?: string
    materialSourceGroup?: string
    viewLearn?: string
    viewCatalog?: string
    learnModeHint?: string
    learnPrimary?: string
    learnShort?: string
    learnReference?: string
    learnEmpty?: string
    engagementViewed?: string
    engagementHelpful?: string
    engagementApplied?: string
    engagementHint?: string
    shortsOpenSearchLabel?: string
    youtubeShortsChannelLabel?: string
    catalogVideoUnit?: string
    catalogMoreAvailable?: string
    refWindowTitle?: string
    refWindowSearchPlaceholder?: string
    refWindowSearch?: string
    refWindowOpenExternal?: string
    referenceSourceSelector?: string
    referenceSourcePinterest?: string
    referenceSourceYoutube?: string
    referenceSourceArtstation?: string
    referenceSourceGoogle?: string
    refWindowTags?: string
    refWindowAll?: string
    refWindowLoading?: string
    refWindowEmpty?: string
    refWindowPaneLoading?: string
  }
  rewards: {
    title: string
    questXp: string
    skillXp: string
    playerXp: string
    category: string
    dismiss: string
    /** Explains quest XP vs skill tree XP (not a literal fraction due to time bonuses) */
    skillXpRenownHint?: string
    dailyBonusLine: string
    weeklyBonusLine: string
  }
  categories: {
    drawing: string
    anatomy: string
    animation: string
    effects: string
    storytelling: string
    character_design: string
    environment: string
  }
  dashboard: {
    title: string
    totalLevel: string
    activeQuest: string
    dailyQuests: string
    dailyCompleted: string
    streakRecoveryBanner?: string
    streakRecoveryStartHint?: string
    streak?: string
    questsToday?: string
    completed?: string
    strengthens?: string
    startPractice?: string
    practiceRefsConfirmTitle?: string
    practiceRefsConfirmMessage?: string
    recommendedQuest?: string
    recommendedDailyHint?: string
    recommendedWeakHint?: string
    dailyQuestsPartialHint?: string
    dailyQuestsEmptyHint?: string
    today?: string
    todayPracticeFocus?: string
    nextBestActionLabel?: string
    reviewShelfAllCaughtUp?: string
    reviewTitle?: string
    reviewHint?: string
    reviewCta?: string
    xpEconomyHint?: string
    continueQuest?: string
    continueSkillPractice?: string
    dailyStreakDays?: string
    todayCompleteTitle?: string
    todayCompleteBody?: string
    tomorrowPreviewBody?: string
    reviewDueBadge?: string
    weakestCriterionTitle?: string
    weakestCriterionBody?: string
    shareProgress?: string
    allSkillsLink?: string
    nextActionTitle?: string
    learningPlanTitle?: string
    nextActionDailyReason?: string
    nextActionDailyBadge?: string
    nextActionMistakeReason?: string
    nextActionSecondaryTitle?: string
    nextActionSecondaryCta?: string
    nextActionSkillReviewTitle?: string
    nextActionSkillReviewReason?: string
    nextActionMaterialsTitle?: string
    nextActionImprovementReason?: string
    nextActionWarmupReason?: string
    nextActionReviewReason?: string
    nextActionStartWarmup?: string
    nextActionStartFundamentals?: string
    nextActionFundamentalsReason?: string
    nextActionOpenMaterials?: string
    learningPlanFundamentalsTitle?: string
    learningPlanFundamentalsReason?: string
    learningPlanFundamentalsReasonShort?: string
    learningPlanWarmupTitle?: string
    learningPlanWarmupReason?: string
    learningPlanWarmupReasonShort?: string
    learningPlanDailyTitle?: string
    learningPlanDailyReason?: string
    learningPlanQuestReviewTitle?: string
    learningPlanQuestReviewReason?: string
    learningPlanRecommendedTitle?: string
    learningPlanRecommendedWeakCriterion?: string
    learningPlanRecommendedMistake?: string
    learningPlanRecommendedImprovement?: string
    learningPlanRecommendedWeakest?: string
    learningPlanSkillReviewReason?: string
    learningPlanMaterialsTitle?: string
    learningPlanMaterialsReason?: string
    learningPlanDailyNextHint?: string
    scrollToDailies?: string
    showAll?: string
    showLess?: string
    goalTitle?: string
    goalHint?: string
    goalPlaceholder?: string
    goalSave?: string
    goalEdit?: string
    goalComplete?: string
    goalNewPlaceholder?: string
    goalsHistoryLink?: string
  }
  quests: {
    title: string
    dailyQuests: string
    allQuests: string
    viewRecommended?: string
    viewAll?: string
    watchFirst?: string
    quickDifficulty?: string
    skipMicroSteps?: string
    microStepsRequired?: string
    dailyCompleted: string
    questCompleted: string
    minLevel?: string
    medium?: string
    mediumTraditional?: string
    mediumDigital?: string
    mediumBoth?: string
    startSession?: string
    referenceGuideTitle?: string
    materials?: string
    sessionRefsTitle?: string
    sessionRefsHint?: string
    attachReference?: string
    weeklyChallenge?: string
    weeklyChallengeHint?: string
    weeklyChallengeDone?: string
    weeklyChallengeCta?: string
    weeklyChallengeLockedHint?: string
    dailyProgressToday?: string
    prerequisiteLocked?: string
    prerequisiteRequires?: string
    xpBreakdownTitle?: string
    xpBreakdownQuest?: string
    xpBreakdownSkill?: string
    xpBreakdownPhase?: string
    /** Last self-review notes from a previous completion (repeatable quests) */
      lastPracticeNotes?: string
      microChallenges: string
      microChallengesSessionHint: string
      microChallengeCompleted: string
      sessionPlanTitle?: string
      phaseLabelWarmup?: string
      phaseLabelCore?: string
      phaseLabelPolish?: string
      phaseLabelStep?: string
      phaseSelfCheckLabel?: string
      locked: string
      sessionPhaseNext: string
      sessionCurrentPhase: string
      sessionTotalRemaining: string
      sessionPhasesComplete: string
      referencePhaseLabel: string
      phaseMediaAdd?: string
      phaseMediaDrop?: string
      phaseMediaHint?: string
      sessionPhaseTotal?: string
      noPrerequisites?: string
      timerExpired?: string
    timerExpiredCta?: string
    gracePeriodHint?: string
    overtimeHint?: string
    overtimeXpNote?: string
    typicalTimeLabel?: string
    lastCompletionTimeLabel?: string
    timeoutFailTitle?: string
    timeoutFailBody?: string
    timeoutFailCta?: string
    timerMainLabel?: string
    timerReferenceLabel?: string
    needReferences?: string
    overlayReference?: string
    overlayCancelQuest?: string
    referenceYoutube?: string
    referenceYoutubeLong?: string
    referenceYoutubeShort?: string
    referencePinterest?: string
    referenceClipTips?: string
    referenceSketchfab?: string
    referenceBonusAdded?: string
    sessionOverlayEmptyHint?: string
    sessionOverlayExpandAria?: string
    warmupSessionHint?: string
    fundamentalsSessionHint?: string
    fundamentalsStepsTitle?: string
    reflectionCriteriaHint?: string
    submitMistakeTagsHint?: string
    submitMistakeTagsRequired?: string
    submitMistakeTagsHardHint?: string
    learningHintFocusSuffix?: string
    submitUploadFirstHint?: string
    learningHintLine?: string
    startQuestNow?: string
    repeatableQuest?: string
    sessionModeTitle?: string
    sessionModeSubtitle?: string
    sessionNotesLabel?: string
    sessionNotesPlaceholder?: string
    workCommentLabel?: string
    workCommentPlaceholder?: string
    addQuest?: string
    addQuestTitle?: string
    addQuestHint?: string
    addQuestNameLabel?: string
    addQuestSkillLabel?: string
    addQuestDescLabel?: string
    addQuestDescOptional?: string
    addQuestDescPlaceholder?: string
    addQuestMatchedReference?: string
    addQuestDetectedSkill?: string
    addQuestSubmit?: string
    addQuestValidation?: string
    addQuestEstimateTitle?: string
    addQuestSkillXpLine?: string
    addQuestBreakdownSemantic?: string
    addQuestBreakdownCatalog?: string
    addQuestBreakdownVolume?: string
    addQuestConfidenceHigh?: string
    addQuestConfidenceMedium?: string
    addQuestConfidenceLow?: string
    addQuestConfidenceSemantic?: string
    addQuestUnderstood?: string
    editTitleLabel?: string
    editTitleSave?: string
    editTitleReset?: string
    editTitleLangHint?: string
    deleteQuest?: string
    deleteQuestTitle?: string
    deleteQuestConfirm?: string
    feedbackSaved?: string
    feedbackTitle?: string
    feedbackDifficulty?: string
    feedbackDifficultyHint?: string
    feedbackQuality?: string
    feedbackOptionalNote?: string
    feedbackSkip?: string
    feedbackSubmit?: string
    feedbackLineConfidence?: string
    feedbackProportion?: string
    feedbackValueRange?: string
    feedbackComposition?: string
    feedbackTiming?: string
    feedbackPose?: string
  }
  achievements: {
    title: string
    unlocked: string
    unlockProgress: string
    allUnlocked: string
    achievementUnlocked?: string
    secretRemainingOne: string
    secretsRemaining: string
    endgameBadge: string
  }
  gallery: {
    empty: string
    emptyHint: string
    allQuestsBtn: string
    dailyQuestsBtn: string
    versions: string
    showLatest: string
    showAll: string
    before: string
    after: string
    selectTwo: string
    categoryBadge: string
    collapse: string
    expand: string
    loading: string
    stepLabel: string
    showInFolder: string
    showInFolderDisabled?: string
    unknownQuest: string
    lightboxPrev: string
    lightboxNext: string
    viewGrouped: string
    viewGrid: string
    viewCompact: string
    sortNewest: string
    sortOldest: string
    scopeAllTime: string
    scopeToday: string
    workComment: string
    cloudUploaded: string
    cloudPending: string
    cloudFailed: string
    filterAllCategories?: string
    redoQuest?: string
    improvementNotes?: string
    mistakeTagsLabel?: string
    compareVersions?: string
    practiceNext?: string
    shareStory?: string
    whatWentWellPlaceholder?: string
    searchPlaceholder?: string
    searchAria?: string
    filterEmpty?: string
    favoritesOnly?: string
    favoriteOn?: string
    favoriteOff?: string
  }
  settings: {
    title: string
    sound: string
    enableSounds: string
    volume: string
    testSound: string
    ambientEnabled?: string
    ambientVolume?: string
    language: string
    selectLanguage: string
    favoriteCategories: string
    favoriteCategoriesHint: string
    randomCategories: string
    randomCategoriesHint: string
    selectUpToThree: string
    desktopSection?: string
    questShortcutsSection?: string
    questShortcutsHint?: string
    shortcutAdvance?: string
    shortcutOverlay?: string
    shortcutOpenReferences?: string
    shortcutShowMain?: string
    shortcutReset?: string
    shortcutResetAll?: string
    shortcutCaptureListening?: string
    shortcutCaptureClick?: string
    breakReminderTitle?: string
    breakReminderBody?: string
    breakReminderDone?: string
    devToolsTitle?: string
    devAdvanceDayHint?: string
    devDateShifted?: string
    devDayPlusOne?: string
    artIdleSecondsUnit?: string
    artAppsSection?: string
    artAppsHint?: string
    artAppsHintOff?: string
    artAppsEnabled?: string
    /** Shown on macOS/Linux — foreground detection is Windows-only */
    artAppsPlatformNote?: string
    artAppsCustom?: string
    artAppsCustomPath?: string
    artAppsCustomChange?: string
    artIdleTimeout?: string
    minimizeToTray?: string
    sessionWidgetMode?: string
    sessionWidgetModeHint?: string
    openAtLogin?: string
    reminders?: string
    remindersHint?: string
    reminderTime?: string
    testNotification?: string
    accessibilitySection?: string
    fontScale?: string
    fontSmall?: string
    fontMedium?: string
    fontLarge?: string
    highContrast?: string
    reduceMotion?: string
    telemetryEnabled?: string
    vfxQuality?: string
    vfxQualityOff?: string
    vfxQualityNormal?: string
    vfxQualityEnhanced?: string
    disableSessionTimers?: string
    disableSessionTimersHint?: string
    tourAndResetSection?: string
    /** Re-show first-run welcome dialog */
    showWelcomeTipsAgain?: string
    /** Launch the full app tour from settings */
    fullAppTour?: string
    theme: string
    themeModern: string
    themeLight: string
    themeRpg: string
    themeStudio?: string
    widgetSection?: string
    storageSection?: string
    storageLocal?: string
    storageCloud?: string
    storageLocalAndCloud?: string
    storageCloudOnly?: string
    storageLocalHint?: string
    personalizationSection?: string
    technicalSection?: string
    googleDrive?: string
    connectGoogle?: string
    disconnectGoogle?: string
    connected?: string
    notConnected?: string
    googleDrivePath?: string
    googleDrivePathHint?: string
    retryCloudUpload?: string
    cloudSync?: string
    cloudSyncDone?: string
    googleDriveOpenFolder?: string
    googleDriveCloudHint?: string
    googleDriveFolderPending?: string
    googleDriveReconnectRequired?: string
    cloudUploadRetryStarted?: string
    cloudUploadRetryDone?: string
    cloudSecurityHint?: string
    privacyLocalOnly?: string
    backupSection?: string
    exportProgress?: string
    importProgress?: string
    exportProgressHint?: string
    lastExportAt?: string
    importSuccess?: string
    importFailed?: string
    exportFailed?: string
    exportSuccess?: string
    storageUpdateFailed?: string
    syncFailed?: string
    includeMediaExport?: string
    referenceSourceTitle?: string
    referenceSourceHint?: string
    useGoogleForReferenceLogin?: string
    useGoogleForReferenceLoginHint?: string
    useGoogleForReferenceLoginBtn?: string
    referencesSection?: string
    appearanceSection?: string
    dataSection?: string
  }
  onboarding: {
    welcomeTitle: string
    welcomeIntro: string
    clickToContinue: string
    skillsTitle: string
    skillsBody: string
    dailiesTitle: string
    dailiesBody: string
    navTitle: string
    navBody: string
    questsTitle: string
    questsBody: string
    galleryTitle: string
    galleryBody: string
    skillsPageTitle: string
    skillsPageBody: string
    skillsNodeDemoTitle: string
    skillsNodeDemoBody: string
    statisticsTitle: string
    statisticsBody: string
    resourcesTitle: string
    resourcesBody: string
    achievementsTitle: string
    achievementsBody: string
    goalsTitle?: string
    goalsBody?: string
    materialsEngagementBody?: string
    settingsStorageBody?: string
    settingsTitle: string
    settingsBody: string
    skipTour: string
    stepProgress: string
    quickWelcomeIntro: string
    quickSkillsBody?: string
    quickNextActionTitle?: string
    quickNextActionBody?: string
    quickDailiesBody: string
    quickNavBody: string
    quickFullTourTitle: string
    quickFullTourBody: string
    portraitStarsTitle?: string
    portraitStarsBody?: string
  }
  levelUp: {
    title: string
    reachedLevel: string
  }
  dayComplete: {
    title: string
    streak: string
    bonus: string
    star: string
    continue: string
  }
  sessionRitual?: {
    intentTitle?: string
    durationLabel?: string
    focusLabel?: string
    goalLabel?: string
    goalPlaceholder?: string
    startPractice?: string
    exitTitle?: string
    xpEarned?: string
    practiceTime?: string
    weakSpot?: string
    nextStep?: string
    viewGallery?: string
    done?: string
    chestTitle?: string
    chestBody?: string
    chestClaim?: string
    reviewShelfTitle?: string
    reviewOverdue?: string
    chapterTitle?: string
    chapterFoundation?: string
    chapterAnatomy?: string
    chapterMotion?: string
    chapterWeeks?: string
    chapterComplete?: string
    chapterContinue?: string
    growthWallTitle?: string
    growthWallEmpty?: string
    monthlySummaryTitle?: string
    monthlySummaryQuests?: string
    monthlySummaryMinutes?: string
    monthlySummaryGrowth?: string
    monthlySummaryMistake?: string
    energyModeLabel?: string
    energyModeHint?: string
    energyShort?: string
    energyMedium?: string
    energyLong?: string
    ambientPresetLabel?: string
    ambientRain?: string
    ambientCafe?: string
    ambientFireplace?: string
    ambientStudio?: string
    ambientQuiet?: string
    ambientRpg?: string
    studioThemeLabel?: string
    phaseWarmupDone?: string
    phaseCoreStart?: string
    phasePolishStart?: string
  }
  upload: {
    dropZoneLabel: string
    dropHint: string
  }
  character: {
    novice: string
    apprentice: string
    journeyman: string
    master: string
    legend: string
  }
  profile: {
    welcomeTitle: string
    welcomeIntro: string
    chooseDrawing: string
    chooseAnimation: string
    changeLaterHint: string
    artistRole: string
    animatorRole: string
    settingsTitle: string
    settingsHint: string
    drawingFocus: string
    animationFocus: string
    avatarTitle?: string
    avatarIntro?: string
    artAppsTitle?: string
    artAppsIntro?: string
    explorePathHint?: string
    experienceTitle?: string
    experienceIntro?: string
    experienceBeginner?: string
    experienceBeginnerHint?: string
    experienceIntermediate?: string
    experienceIntermediateHint?: string
    experienceAdvanced?: string
    experienceAdvancedHint?: string
    experienceSettingsTitle?: string
    experienceSettingsHint?: string
    experienceChangeWarning?: string
    experienceBeginnerFundamentalsHint?: string
  }
  fundamentals?: {
    title: string
    pageIntro?: string
    progressHint?: string
    gateHint?: string
    gateUnlocked?: string
    dailyLockedHint?: string
    viewAll?: string
    upNext?: string
    continueCta?: string
    startCta?: string
    trackPhaseProgress?: string
    uploadOptionalHint?: string
    pathComplete?: string
    locked?: string
    startCurrent?: string
    catalogBanner?: string
    tiers?: {
      beginner: string
      intermediate: string
      advanced: string
    }
    bookPageLabel?: string
    bookPagesLabel?: string
    bookPagesHint?: string
    bookPagesShow?: string
    bookPagesHide?: string
  }
  softRestart: {
    title: string
    bodyLines: string[]
    easyStart: string
    continuePlaying: string
  },
  errors: {
    saveFailed: string
    storageFull: string
    resetFailed: string
    progressCorrupt: string
    loadFailed: string
    exportCorruptBackup: string
    showBackupFolder: string
    retryLoad: string
    startFreshAfterCorrupt: string
    dismiss: string
    boundaryTitle?: string
    boundaryRecover?: string
    boundaryReload?: string
    boundaryExhausted?: string
    boundaryTryAgain?: string
  }
  stats: {
    title: string
    empty: string
    totalSessions: string
    practiceMinutesTotal: string
    activeDays: string
    weeklyPractice: string
    byCategory: string
    byDifficulty: string
    topQuests: string
    timesCompleted: string
    uncategorized: string
    speedRuns: string
    weeklyInsight: string
    weeklyQuests: string
    weeklyMinutes: string
    habitsTitle: string
    dailyStreak: string
    bestStreak: string
    chestProgress: string
    weeklyChallengeStatus: string
    weeklyChallengePending: string
    weeklyChallengeDone: string
    practiceHeatmap: string
    practiceHeatmapHint: string
    practiceHeatmapAria: string
    streakExplainer: string
    skillRadar: string
    skillRadarLevel: string
    adaptiveDifficulty: string
    adaptiveFocusTags?: string
    adaptiveEasier: string
    adaptiveHarder: string
    adaptiveBalanced: string
    monthlySummaryTitle?: string
    monthlySummaryQuests?: string
    monthlySummaryMinutes?: string
    monthlySummaryGrowth?: string
    monthlySummaryMistake?: string
  }
  desktop: {
    reminderTitle: string
    reminderBody: string
  }
  reference: {
    title: string
    search: string
    grid: string
    pipette: string
    ruleOfThirds: string
    goldenRatio: string
    diagonal: string
    opacity: string
    pickColor: string
    hex: string
    rgb: string
    hsl: string
    copied: string
    noImage: string
    swatches: string
    clearSwatches: string
    savedHint?: string
    savedEmpty?: string
    pasteHint?: string
    addFromFile?: string
    savedBadge?: string
  }
}

import { zh } from './locales/zh'
import { zhTw } from './locales/zh-tw'
import { ja } from './locales/ja'
import { ko } from './locales/ko'

export const translations: Record<Language, any> = {
  en: {
    nav: {
      home: 'Home',
      quests: 'Quests',
      gallery: 'Gallery',
      skills: 'Skills',
      statistics: 'Statistics',
      resources: 'Resources',
      achievements: 'Achievements',
      progress: 'Progress',
      settings: 'Settings',
      more: 'More',
      primaryNav: 'Main navigation',
    },
    progress: {
      title: 'Progress',
      timeline: 'Timeline',
      calendar: 'Calendar',
      totalCompleted: 'Total completed',
      currentStreak: 'Practice streak (days with quests)',
      bestStreak: 'Best practice streak',
      practiceStreak: 'Practice streak',
      practiceStreakBest: 'Best: {days} days',
      avgPerWeek: 'Avg per week',
      days: 'days',
      questsOnDate: '{count} quests completed on {date}',
      noCompletions: 'No quests completed yet. Start your journey!',
      completedOn: 'Completed on {date}',
      goals: 'Goals',
      goalsEmpty: 'No completed goals yet. Mark a goal done on the dashboard when you achieve it.',
      goalCompletedOn: 'Completed {date}',
      goalStartedOn: 'Started {date}',
    },
    portrait: {
      settingsTitle: 'Character portrait',
      settingsHint: 'Choose the base look for your dashboard avatar. Replace files in public/portraits/ to use custom art.',
      genderMale: 'Male',
      genderFemale: 'Female',
      chestHint: 'Complete all daily quests — one star per day. Fill all five stars to complete the streak cycle.',
      rewardStarsLabel: 'Daily reward · {current}/{total}',
      streakShieldAvailable: 'Streak shield ready — protects one missed day this month',
      streakShieldUsed: 'Streak shield used — your progress was saved!',
      streakShieldUsedThisMonth: 'Shield used this month',
      streakShieldLabel: 'Streak shield',
      customAvatarCropTitle: 'Crop your avatar',
      customAvatarCropHint: 'Drag to move, scroll or use +/- to zoom. Only the square area will appear on the dashboard.',
      customAvatarConfirm: 'Use this photo',
      customAvatarDoubleClickHint: 'Double-click to choose a custom avatar photo',
      customAvatarClickHint: 'Click to choose a custom avatar photo',
      customAvatarZoomIn: 'Zoom in',
      customAvatarZoomOut: 'Zoom out',
    },
    common: {
      back: 'Back',
      details: 'Details',
      completed: 'Completed',
      startQuest: 'Take Quest',
      cancel: 'Abandon',
      submit: 'Submit Work',
      save: 'Save',
      selectFile: 'Choose File',
      complete: 'Complete',
      allQuests: 'All Quests',
      xp: 'XP',
      minutes: 'min',
      category: 'Category',
      source: 'Source',
      difficulty: 'Difficulty',
      timeRemaining: 'Time Remaining',
      pauseQuest: 'Pause',
      resumeQuest: 'Resume',
      resetProgress: 'Reset Progress',
      cancelConfirm: 'Really cancel this quest?',
      resetConfirm: 'Are you sure you want to reset all progress?',
      resetSuccess: 'Progress has been reset',
      noQuestsFound: 'No quests found for this filter',
      noQuestsHint: 'Change direction or difficulty in the filters, or clear linked tag filters (from search).',
      loadingRoute: 'Loading…',
      appLoading: 'Loading ArtQuest…',
      loading: 'Loading…',
      questsLoadError: 'Failed to load quests data. Please restart the app.',
      questNotFound: 'Quest not found',
      confirm: 'Confirm',
      open: 'Open',
      close: 'Close',
      previousPage: 'Previous page',
      nextPage: 'Next page',
      removeUpload: 'Remove upload',
      abandonQuestTitle: 'Abandon quest?',
      abandonQuestBody: 'Your session progress for this quest will be lost.',
      attachmentRequired: 'Attach your work to complete this quest.',
      submitFailed: 'Could not submit the quest. Please try again.',
      submitFailedSave: 'Could not save your work. Check disk space and try again.',
      submitAlreadyCompleted: 'This quest is already completed and cannot be submitted again.',
      submitPartialUpload: 'Some files could not be saved. Your quest was completed with the files that uploaded successfully.',
      submitStorageFull: 'Could not save progress — storage is full. Export your progress and free space.',
      gotIt: 'Got it',
      retry: 'Retry',
      continue: 'Continue',
      secondsAbbr: 'sec',
    },
    a11y: {
      skipToMain: 'Skip to main content',
    mainNavigation: 'Main navigation',
      appHome: 'ArtQuest home',
      questCard: 'Quest: {title}',
      difficultyBadge: 'Difficulty: {label}',
      questActions: 'Quest actions',
      viewQuestDetails: 'View details for {title}',
      questCompletedStatus: '{title} is completed',
      startQuestNamed: 'Start quest {title}',
      zoneMap: 'Zone map',
      uploadPreviewVideo: 'Uploaded work preview',
    },
    difficulty: {
      novice: 'Novice',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      master: 'Master',
      expert: 'Expert',
      all: 'All',
    },
    skills: {
      title: 'Skills',
      level: 'Level',
      maxXp: 'Max XP',
      available: 'Available',
      in_progress: 'In Progress',
      review: 'Review',
      mastered: 'Mastered',
      start_practice: 'Start practice (timer)',
      repeat: 'Repeat',
      interval: 'Interval',
      days: 'days',
      practiceElapsed: 'Session time',
      pausePractice: 'Pause',
      resumePractice: 'Resume',
      endPractice: 'Finish & apply XP',
      practiceHint: 'Timer counts up. When you stop drawing, tap finish — time converts to skill XP for this node.',
      practiceInProgress: 'Finish the active practice session first',
      practiceComplete: 'Practice complete!',
      requires: 'Requires',
      resources: 'Resources & videos',
      nodeMasteredHint: 'Node mastered! Keep practicing for prestige.',
      maxPrestigeReached: '🌟 Maximum prestige reached!',
      activePractice: 'Active practice',
      practiceMinimizedHint: 'Timer keeps running — open the node again or use the navbar widget.',
      practiceMinArtAppHint: 'Min. 1 min in your art app',
      practiceArtAppPausedHint: 'Timer paused — return to your art app to count time.',
      collapseToWidget: 'Collapse to widget',
      practiceConfirmTitle: 'Start practice?',
      practiceConfirmMessage: 'The practice timer will start when you open materials. Continue?',
      cancelPractice: 'Cancel',
      emptyHint: 'Complete daily quests on the dashboard — quest XP unlocks skill nodes here.',
      emptyCta: 'Go to dashboard',
      nextUnlock: 'Next unlock',
      nextPracticeHint: 'Recommended practice for this branch right now.',
      stretchReminderTitle: 'You\'re doing great!',
      stretchReminderBody: 'Time to stand up and stretch a bit.',
    },
    categories: {
      drawing: 'Drawing',
      anatomy: 'Anatomy',
      animation: 'Animation',
      effects: 'Effects',
      storytelling: 'Storytelling',
      character_design: 'Character Design',
      environment: 'Environment',
    },
    dashboard: {
      title: 'Practice',
      totalLevel: 'Total Level',
      activeQuest: 'Active Quest',
      dailyQuests: 'Daily Quests',
      dailyCompleted: 'Daily Quests Completed!',
      streak: 'days',
      questsToday: 'quests',
      completed: 'completed',
      strengthens: 'Strengthens',
      startPractice: 'Start Practice',
      practiceRefsConfirmTitle: 'Start practice timer?',
      practiceRefsConfirmMessage: 'Opening materials will start the practice session and timer. Continue?',
      streakRecoveryBanner: 'Streak shield: complete 4 daily quests today — you skipped one day. After today, targets return to 3.',
      streakRecoveryStartHint:
        'You missed yesterday’s daily quests. Your streak shield protects your progress — finish today’s {count} quests to keep your streak.',
      recommendedQuest: 'Recommended for you',
      recommendedDailyHint: 'Finish today’s daily lineup',
      recommendedWeakHint: 'Grow your weakest skill track',
      dailyQuestsPartialHint: 'Only {available} of {expected} daily quests available today — complete more catalog quests or level up skills to unlock more.',
      dailyQuestsEmptyHint: 'No daily quests available right now. Explore the quest catalog or repeat practice quests.',
      today: 'Today',
      todayPracticeFocus: "Today's practice",
      nextBestActionLabel: 'Next action',
      reviewShelfAllCaughtUp: 'All caught up — no quests due for review right now.',
      reviewTitle: 'Skills due for review',
      reviewHint: 'Refresh these tracks to keep progress from fading.',
      reviewCta: 'Open skills',
      xpEconomyHint: 'Quest XP goes to your skill tree; time and bonus multipliers apply.',
      continueQuest: 'Continue quest',
      continueSkillPractice: 'Continue practice',
      dailyStreakDays: 'day',
      todayCompleteTitle: 'Today complete!',
      todayCompleteBody: 'You finished every daily quest. Great work — see you tomorrow.',
      tomorrowPreviewBody: 'Tomorrow’s dailies may focus on: {categories}',
      reviewDueBadge: 'Review due',
      weakestCriterionTitle: 'Focus this week',
      weakestCriterionBody: 'Your self-reviews suggest improving: {criterion}',
      shareProgress: 'Share progress',
      allSkillsLink: 'All skills →',
      nextActionTitle: 'Best for today',
      learningPlanTitle: "Today's plan",
      nextActionDailyReason: '{done}/{total} dailies done — finish today\'s lineup for streak and stars.',
      nextActionDailyBadge: 'Daily quest',
      nextActionMistakeReason: 'Matched to recurring mistakes from your recent work.',
      nextActionSecondaryTitle: 'Also practice',
      nextActionSecondaryCta: 'Start focus quest',
      nextActionSkillReviewTitle: 'Skill review due',
      nextActionSkillReviewReason: 'Skill node overdue by {days} day(s) — refresh this track.',
      nextActionMaterialsTitle: 'Study materials for your focus',
      nextActionImprovementReason: 'Based on gallery notes — reinforce your weak spot in practice.',
      nextActionWarmupReason: 'A short warm-up is the best way to start your day.',
      nextActionReviewReason: 'Time to review — spaced reinforcement.',
      nextActionStartWarmup: 'Start 5 min',
      nextActionStartFundamentals: 'Start fundamentals',
      nextActionFundamentalsReason:
        'Complete one fundamentals exercise to unlock daily quests.',
      nextActionOpenMaterials: 'Open materials',
      learningPlanFundamentalsTitle: 'Fundamentals exercise',
      learningPlanFundamentalsReason: 'Complete one fundamentals exercise to unlock daily quests.',
      learningPlanFundamentalsReasonShort: 'Next step on the fundamentals path.',
      learningPlanWarmupTitle: '5-minute warm-up',
      learningPlanWarmupReason: 'Quick start with no penalties — warm up before main practice.',
      learningPlanWarmupReasonShort: 'Start with a short session.',
      learningPlanDailyTitle: 'Daily quest',
      learningPlanDailyReason: '{done}/{total} done today — finish dailies for streak and reward stars.',
      learningPlanQuestReviewTitle: 'Quest review',
      learningPlanQuestReviewReason: 'Spaced review — reinforce the skill while it is still fresh.',
      learningPlanRecommendedTitle: 'Recommended practice',
      learningPlanRecommendedWeakCriterion: 'Self-review suggests improving: {criterion}.',
      learningPlanRecommendedMistake: 'Matched to recurring mistakes from recent work.',
      learningPlanRecommendedImprovement: 'Based on your gallery notes — reinforce a weak spot.',
      learningPlanRecommendedWeakest: 'Grow your weakest skill track.',
      learningPlanSkillReviewReason: 'Skill node overdue by {days}d — refresh this track.',
      learningPlanMaterialsTitle: 'Materials for weak spot',
      learningPlanMaterialsReason: 'Theory and demos: {criterion}.',
      learningPlanDailyNextHint: 'Then: daily quests below ({done}/{total}).',
      scrollToDailies: 'Go to dailies ↓',
      showAll: 'Show all',
      showLess: 'Show less',
      goalTitle: 'Goal',
      goalHint: 'Write what you want to achieve with ArtQuest — it stays here as your daily reminder.',
      goalPlaceholder: 'e.g. Draw a full character sheet in 30 days',
      goalSave: 'Save goal',
      goalEdit: 'Edit',
      goalComplete: 'Mark as completed',
      goalNewPlaceholder: 'What is your next goal?',
      goalsHistoryLink: 'View {count} completed goals →',
    },
    quests: {
      title: 'Quests',
      dailyQuests: 'Daily Quests',
      allQuests: 'All Quests',
      viewRecommended: 'Recommended',
      viewAll: 'Browse all',
      watchFirst: 'Watch first',
      quickDifficulty: 'How hard was it?',
      skipMicroSteps: 'Skip micro-steps',
      microStepsRequired: 'Complete micro-steps or skip (novice only)',
      dailyCompleted: 'Daily quests completed!',
      questCompleted: 'Quest completed!',
      minLevel: 'Required level',
      medium: 'Format',
      mediumTraditional: 'Traditional media',
      mediumDigital: 'Digital',
      mediumBoth: 'Traditional and digital',
      startSession: 'Start timed session',
      referenceGuideTitle: 'Reference & tips',
      materials: 'Materials',
      sessionRefsTitle: 'Your references',
      sessionRefsHint: 'Attach inspiration images for this session — they stay on your device and are not submitted.',
      attachReference: 'Add reference image',
      weeklyChallenge: 'Weekly challenge',
      weeklyChallengeHint: 'One harder quest per week — bonus XP when you finish it.',
      weeklyChallengeDone: 'Done this week',
      weeklyChallengeCta: 'Take weekly challenge',
      weeklyChallengeLockedHint: 'Finish today’s daily quests to unlock this week’s challenge.',
      dailyProgressToday: '{done}/{total} dailies today',
      prerequisiteLocked: 'Locked',
      prerequisiteRequires: 'Complete first:',
      xpBreakdownTitle: 'How XP works',
      xpBreakdownQuest: 'Quest XP — legacy track scales with practice time (25–100% of face value vs estimated session length).',
      xpBreakdownSkill: 'Skill node — 20% of quest XP plus practice minutes (reduced on speed runs).',
      xpBreakdownPhase: 'Session phases — small skill node XP when you complete each step (up to 30% of quest XP).',
      lastPracticeNotes: 'Your notes from last time',
      microChallenges: 'Quick Exercises',
      microChallengesSessionHint: 'These steps run during the quest session — one phase at a time; advance when you are ready.',
      microChallengeCompleted: 'Step completed',
      sessionPlanTitle: 'Session plan',
      phaseLabelWarmup: 'Warmup',
      phaseLabelCore: 'Core',
      phaseLabelPolish: 'Polish',
      phaseLabelStep: 'Step',
      phaseSelfCheckLabel: 'I completed this step’s goal and I’m ready for the next phase',
      locked: 'Locked — complete previous exercise first',
      sessionPhaseNext: 'Next phase',
      sessionCurrentPhase: 'Phase {current} of {total}',
      sessionTotalRemaining: 'Total time left',
      sessionPhasesComplete: 'All exercise phases done — finish your work and submit when ready.',
      phaseMediaAdd: 'Add reference',
      phaseMediaDrop: 'Drop image or GIF here, or click to choose',
      phaseMediaHint: 'Image or GIF for this step — saved for next time you do this quest.',
      sessionPhaseTotal: '{count} phases · {minutes} min total',
      referencePhaseLabel: 'Reference gathering — browse and collect inspiration',
      timerExpired: 'Time is up — take as long as you need. Finish and submit when your work is ready.',
      timerExpiredCta: 'Save your work',
      gracePeriodHint: 'Grace period: {time} left to submit',
      overtimeHint: 'Extra time: {time}',
      overtimeXpNote: 'Quest track XP has a small penalty after the timer; skill node XP reflects your real practice time.',
      typicalTimeLabel: 'typ.',
      lastCompletionTimeLabel: 'Last',
      timeoutFailBody:
        'Unfortunately you did not finish the quest in time. Only skill tree XP was saved. Good luck with the next quest!',
      timeoutFailCta: 'Back to dashboard',
      timerMainLabel: 'Quest time',
      timerReferenceLabel: 'Reference time',
      needReferences: 'Need references?',
      overlayReference: 'Reference',
      overlayCancelQuest: 'Cancel',
      referenceYoutube: 'YouTube',
      referenceYoutubeLong: 'Long videos',
      referenceYoutubeShort: 'Shorts',
      referencePinterest: 'Pinterest',
      referenceClipTips: 'CSP Tips',
      referenceSketchfab: 'Sketchfab',
      referenceBonusAdded: '+{n} min added for reference gathering',
      sessionOverlayEmptyHint: 'Start a quest or practice to see the timer here.',
      sessionOverlayExpandAria: 'Open main window',
      warmupSessionHint: 'Once per day · 5 minutes · single timer',
      fundamentalsSessionHint: 'Follow the steps above. Upload your work when the timer ends.',
      fundamentalsStepsTitle: 'Steps',
      reflectionCriteriaHint: 'Rate what went well (optional)',
      submitMistakeTagsHint: 'Pick what did not work out. (up to 3)',
      submitMistakeTagsRequired: 'Select at least one area that was difficult (required when rating 4–5).',
      submitMistakeTagsHardHint: 'Naming the hardest part helps tailor tomorrow’s practice.',
      learningHintFocusSuffix: ' · Focus: {tags}',
      submitUploadFirstHint: 'Upload your work on the left, then rate difficulty — quality or mistakes follow based on your rating.',
      learningHintLine: 'Trains: {skill} · {category} · ~{minutes} min · {outcome}',
      startQuestNow: 'Start quest',
      repeatableQuest: 'Repeatable — start a new session anytime.',
      sessionModeTitle: 'Session mode',
      sessionModeSubtitle: 'Timer and submission in one place.',
      sessionNotesLabel: 'Work notes',
      sessionNotesPlaceholder: 'What worked? What should improve next session?',
      workCommentLabel: 'Comment on this work',
      workCommentPlaceholder: 'Optional — visible in the gallery with your submission',
      addQuest: 'Add quest',
      addQuestTitle: 'Create your quest',
      addQuestHint: 'Rewards update as you type the title — we compare it to quests already in the library.',
      addQuestNameLabel: 'Quest title',
      addQuestSkillLabel: 'Skill',
      addQuestDescLabel: 'Notes for yourself',
      addQuestDescOptional: '(optional)',
      addQuestDescPlaceholder: 'Extra context for you — does not change XP or time',
      addQuestSubmit: 'Add to library',
      addQuestValidation: 'Enter a quest title.',
      addQuestDetectedSkill: 'Skill: {skill}',
      addQuestEstimateTitle: 'Estimated rewards',
      addQuestSkillXpLine: '~{xp} skill tree XP if you practice the full session',
      addQuestBreakdownSemantic: 'From title analysis: {xp} XP · {min} min',
      addQuestBreakdownCatalog: 'Library match ({pct}%): {xp} XP · {min} min',
      addQuestBreakdownVolume: 'Volume in title: ×{mult}',
      addQuestConfidenceHigh: 'High match',
      addQuestConfidenceMedium: 'Partial match',
      addQuestConfidenceLow: 'Weak match',
      addQuestConfidenceSemantic: 'Title only',
      addQuestMatchedReference: 'Closest library quest ({score}%): «{title}»',
      addQuestUnderstood: 'We read your brief as: {signals}',
      editTitleLabel: 'Edit title',
      editTitleSave: 'Save title',
      editTitleReset: 'Restore original',
      editTitleLangHint: 'Saved for the current interface language only.',
      deleteQuest: 'Delete quest',
      deleteQuestTitle: 'Delete this quest?',
      deleteQuestConfirm:
        'The quest will be removed from the library permanently, including built-in and custom quests. Progress and gallery entries for this quest will also be removed.',
      feedbackTitle: 'How was this quest?',
      feedbackDifficulty: 'Difficulty',
      feedbackDifficultyHint: 'Was it too easy or too hard?',
      feedbackQuality: 'Quality check',
      feedbackLineConfidence: 'Line confidence',
      feedbackProportion: 'Proportions',
      feedbackValueRange: 'Value range',
      feedbackComposition: 'Composition',
      feedbackTiming: 'Timing',
      feedbackPose: 'Pose',
      feedbackOptionalNote: 'Your notes (optional)',
      feedbackSkip: 'Skip',
      feedbackSubmit: 'Save feedback',
      feedbackSaved: 'Feedback saved!',
    },
    rewards: {
      title: 'Rewards',
      questXp: 'Legacy track',
      playerXp: 'player XP',
      skillXp: 'skill node',
      category: 'category',
      dismiss: 'Dismiss',
      skillXpRenownHint:
        'Legacy track gets the full quest XP on completion. Skill nodes get 20% plus practice time.',
      dailyBonusLine: 'Daily lineup bonus',
      weeklyBonusLine: 'Weekly challenge bonus',
    },
    achievements: {
      title: 'Achievements',
      unlocked: 'Unlocked!',
      unlockProgress: '{unlocked} / {total} unlocked',
      allUnlocked: 'Congratulations! All achievements unlocked!',
      achievementUnlocked: 'Achievement Unlocked!',
      secretRemainingOne: '1 secret achievement remaining',
      secretsRemaining: '{n} secret achievements remaining',
      endgameBadge: 'Endgame',
    },
    gallery: {
      empty: 'No works uploaded yet',
      emptyHint: 'Complete quests and upload photos of your results',
      allQuestsBtn: 'All quests',
      dailyQuestsBtn: 'Daily quests',
      versions: 'versions',
      showLatest: 'Show latest',
      showAll: 'Show all',
      before: 'Before',
      after: 'After',
      selectTwo: 'Select two versions to compare',
      categoryBadge: 'Track',
      collapse: 'Collapse',
      expand: 'Expand',
      loading: 'Loading…',
      stepLabel: 'Step {n}',
      showInFolder: 'Show in folder',
      showInFolderDisabled: 'File not saved locally',
      unknownQuest: 'Unknown quest',
      lightboxPrev: 'Previous image',
      lightboxNext: 'Next image',
      viewGrouped: 'Growth wall',
      viewGrid: 'Grid',
      viewCompact: 'List',
      sortNewest: 'Newest first',
      sortOldest: 'Oldest first',
      scopeAllTime: 'All time',
      scopeToday: 'Today',
      workComment: 'Comment',
      cloudUploaded: 'Uploaded',
      cloudPending: 'Upload pending',
      cloudFailed: 'Upload failed',
      filterAllCategories: 'All categories',
      redoQuest: 'Redo quest',
      improvementNotes: 'Improve next time',
      mistakeTagsLabel: 'What did not work:',
      compareVersions: 'Compare before / after',
      practiceNext: 'Next practice',
      shareStory: 'Share story',
      whatWentWellPlaceholder: 'What went well…',
      searchPlaceholder: 'Search works, tags, notes',
      searchAria: 'Search gallery',
      filterEmpty: 'No works match these filters',
      favoritesOnly: 'Favorites',
      favoriteOn: '★ Favorite',
      favoriteOff: '☆ Add favorite',
    },
    settings: {
      title: 'Settings',
      sound: 'Sound',
      enableSounds: 'Enable notification sounds',
      volume: 'Volume',
      testSound: 'Test Sound',
      ambientEnabled: 'Ambient practice loop',
      ambientVolume: 'Ambient volume',
      language: 'Language',
      selectLanguage: 'Select language',
      favoriteCategories: 'Favorite Categories',
      favoriteCategoriesHint: 'Choose up to 3 categories for daily quests (one quest per category). Changing favorites updates today’s dailies on the dashboard.',
      randomCategories: 'Fully Random Categories',
      randomCategoriesHint: 'Ignore favorites — pick 3 random categories each day.',
      selectUpToThree: 'Select up to 3 favorites — dashboard dailies follow these categories',
      desktopSection: 'Desktop & reminders',
      questShortcutsSection: 'Quest session shortcuts',
      questShortcutsHint: 'Active during a session (Electron). Click the button and press the desired key or combo.',
      shortcutAdvance: 'Next phase',
      shortcutOverlay: 'Show / hide timer widget',
      shortcutOpenReferences: 'Open reference window',
      shortcutShowMain: 'Show main window',
      shortcutReset: 'Reset',
      shortcutResetAll: 'Reset all',
      shortcutCaptureListening: 'Press keys…',
      shortcutCaptureClick: 'Click to set',
      breakReminderTitle: 'Eye break: 20-20-20',
      breakReminderBody: 'Look at something 20 feet away for about 20 seconds. No XP penalty.',
      breakReminderDone: 'Done',
      devToolsTitle: 'Dev Tools',
      devAdvanceDayHint: 'Advance 1 day',
      devDateShifted: '✓ Date set to {date}',
      devDayPlusOne: 'Day +1',
      artIdleSecondsUnit: 'sec',
      artAppsSection: 'Art app tracking',
      artAppsHint: 'XP and session timers count only when a selected app is in the foreground and you are active.',
      artAppsHintOff: 'When off, time counts whenever ArtQuest is open (no art-app focus check).',
      artAppsEnabled: 'Enable art app tracking',
      artAppsPlatformNote:
        'Foreground art-app detection is only available on Windows. On macOS and Linux, practice time counts as active while ArtQuest is open.',
      artAppsCustom: 'Other',
      artAppsCustomPath: 'Selected application',
      artAppsCustomChange: 'Change…',
      artIdleTimeout: 'Pause after idle',
      minimizeToTray: 'Keep running when closing window (taskbar tray)',
      sessionWidgetMode: 'Session widget mode',
      sessionWidgetModeHint:
        'After you start a quest or skill practice, tap “Collapse to widget” on the session screen. A small floating timer opens — nothing collapses until you press that button.',
      openAtLogin: 'Start ArtQuest when you sign in',
      reminders: 'Daily practice reminder (local time)',
      remindersHint: 'One notification around the chosen time once per calendar day.',
      reminderTime: 'Reminder time',
      testNotification: 'Test notification',
      accessibilitySection: 'Accessibility',
      fontScale: 'Font size',
      fontSmall: 'Small',
      fontMedium: 'Default',
      fontLarge: 'Large',
      highContrast: 'Higher contrast surfaces',
      reduceMotion: 'Reduce motion',
      telemetryEnabled: 'Share anonymous diagnostics (local only)',
      vfxQuality: 'Celebration effects',
      vfxQualityOff: 'CSS only',
      vfxQualityNormal: 'Normal',
      vfxQualityEnhanced: 'Enhanced',
      disableSessionTimers: 'Disable session timers',
      disableSessionTimersHint:
        'Pause countdown timers for quests and skill practice. Finish at your own pace without time pressure.',
      tourAndResetSection: 'Tour & reset',
      showWelcomeTipsAgain: 'Show welcome tips again',
      fullAppTour: 'Full app tour',
      theme: 'Theme',
      themeModern: 'Dark',
      themeLight: 'Light',
      themeRpg: 'Dark Fantasy RPG',
      themeStudio: 'Dark 2',
      widgetSection: 'Widget mode',
      storageSection: 'Storage',
      storageLocal: 'Local only',
      storageCloud: 'Cloud storage',
      storageLocalAndCloud: 'Local + cloud',
      storageCloudOnly: 'Cloud only',
      storageLocalHint: 'Choose where quest results are kept. Gallery previews stay available even in cloud-only mode.',
      personalizationSection: 'Personalization',
      technicalSection: 'Technical',
      referenceSourceTitle: 'Default reference source',
      referenceSourceHint: 'The reference window opens with this source and remembers the last source you choose there.',
      useGoogleForReferenceLogin: 'Use Google account for reference sites',
      useGoogleForReferenceLoginHint:
        'When Google Drive is connected, sign in to Pinterest and other reference sites with {email} via Google.',
      useGoogleForReferenceLoginBtn: 'Sign in with Google ({email})',
      referencesSection: 'References & materials',
      appearanceSection: 'Appearance & sound',
      dataSection: 'Data & sync',
      googleDrive: 'Google Drive',
      connectGoogle: 'Connect Google',
      disconnectGoogle: 'Disconnect',
      connected: 'Connected',
      notConnected: 'Not connected',
      googleDrivePath: 'Google Drive save path',
      googleDrivePathHint: 'Default: /ArtQuest/Gallery. ArtQuest uses the least-privilege drive.file scope.',
      retryCloudUpload: 'Retry failed uploads',
      cloudSync: 'Synchronize',
      cloudSyncDone: 'Sync complete. Downloaded {downloaded}, uploaded {uploaded}, linked {linked}.',
      googleDriveOpenFolder: 'Open Google Drive folder',
      googleDriveCloudHint:
        'Files are saved to your Google Drive online (My Drive → ArtQuest → Gallery). They are not copied into the local Google Drive folder on your PC.',
      googleDriveFolderPending: 'Run Sync first to create or locate the Google Drive folder.',
      googleDriveReconnectRequired:
        'Google Drive access was not granted for this token. Click Disconnect, then Connect again and allow Drive file access in Google.',
      cloudUploadRetryStarted: 'Upload queue restarted. Open Gallery to check status.',
      cloudUploadRetryDone: 'All pending uploads completed.',
      cloudSecurityHint:
        'Cloud upload is opt-in. OAuth uses PKCE and the drive.file scope (ArtQuest files only). Tokens are encrypted with Windows DPAPI in the main process and never sent to the renderer.',
      privacyLocalOnly: 'No external analytics. Practice events stay on this device.',
      backupSection: 'Backup & restore',
      exportProgress: 'Export progress',
      importProgress: 'Import progress',
      exportProgressHint: 'Save your progress as JSON. Gallery files stay on disk unless you include media.',
      lastExportAt: 'Last export',
      importSuccess: 'Progress imported successfully.',
      importFailed: 'Could not import progress file.',
      exportFailed: 'Export failed.',
      exportSuccess: 'Progress exported.',
      storageUpdateFailed: 'Storage update failed.',
      syncFailed: 'Sync failed.',
      includeMediaExport: 'Include gallery media in export',
    },
    character: {
      novice: 'Novice',
      apprentice: 'Apprentice',
      journeyman: 'Journeyman',
      master: 'Master',
      legend: 'Legend',
    },
    profile: {
      welcomeTitle: 'Welcome to ArtQuest',
      welcomeIntro: 'What do you want to focus on first?',
      chooseDrawing: 'Drawing',
      chooseAnimation: 'Animation',
      changeLaterHint: 'You can change this anytime in Settings.',
      artistRole: 'Artist',
      animatorRole: 'Animator',
      settingsTitle: 'Learning profile',
      settingsHint: 'Drawing hides animation quests and skills. Animation keeps every track open.',
      drawingFocus: 'Drawing focus',
      animationFocus: 'Full library (animation included)',
      avatarTitle: 'Choose your character',
      avatarIntro: 'Pick the portrait that represents you on the home screen.',
      artAppsTitle: 'Which art programs do you use?',
      artAppsIntro: 'We only count practice time when one of these apps is active. You can change this later in Settings.',
      experienceTitle: 'How would you rate your level?',
      experienceIntro: 'We will skip very basic exercises if you already have fundamentals.',
      experienceBeginner: 'Beginner',
      experienceBeginnerHint: 'Phased fundamentals tracks; dailies unlock after your first exercise',
      experienceBeginnerFundamentalsHint:
        'You will start with phased fundamentals exercises. Daily quests unlock after the first one.',
      experienceIntermediate: 'Continuing artist',
      experienceIntermediateHint: 'Skip the easiest drills',
      experienceAdvanced: 'Experienced',
      experienceAdvancedHint: 'Focus on intermediate and advanced quests',
      experienceSettingsTitle: 'Skill level',
      experienceSettingsHint: 'Affects daily quest difficulty and recommendations.',
      experienceChangeWarning: 'Changing level recalculates today’s daily quests.',
      chooseExplore: 'Free explore',
      explorePathHint: 'Browse all quests at your own pace',
    },
    fundamentals: {
      title: 'Fundamentals',
      pageIntro:
        'Novice and intermediate phased tracks plus advanced exercises — line control, forms, and imagination.',
      progressHint: '{done}/{total} exercises completed',
      gateHint:
        'Complete one fundamentals exercise to unlock daily quests.',
      gateUnlocked: 'Daily quests unlocked — keep going through the full path!',
      dailyLockedHint: 'Complete one fundamentals exercise to unlock daily quests.',
      viewAll: 'View all',
      upNext: 'Up next',
      startCta: 'Start fundamentals',
      continueCta: 'Continue fundamentals',
      trackPhaseProgress: '{done}/{total} phases',
      uploadOptionalHint: 'Upload optional — you can finish without attaching a file.',
      pathComplete: 'You completed all fundamentals exercises!',
      locked: 'Complete the previous exercise first',
      startCurrent: 'Start',
      catalogBanner:
        'Recommended: finish a fundamentals track and advanced exercises before daily quests. Browse the catalog anytime.',
      tiers: {
        beginner: 'Novice',
        intermediate: 'Intermediate',
        advanced: 'Advanced',
      },
      bookPageLabel: 'Reference page {page}',
      bookPagesLabel: 'Reference pages {start}–{end}',
      bookPagesShow: 'Show reference',
      bookPagesHide: 'Hide',
    },
    softRestart: {
      title: 'Welcome back!',
      bodyLines: [
        'You were away for {days} days.',
        'Your best streak: {longestStreak} days',
        'Skills unlocked: {unlockedSkills}',
        'Start fresh with easier dailies, or keep your current progress.',
      ],
      easyStart: 'Fresh start (keep gallery)',
      continuePlaying: 'Keep playing',
    },
    errors: {
      saveFailed: 'Could not save progress. Your last change may be lost after restart.',
      storageFull: 'Browser storage is full. Export or reset progress in Settings.',
      resetFailed: 'Could not erase saved data on disk. Close the app and try again, or check folder permissions.',
      progressCorrupt:
        'Saved progress could not be read. A backup was created — export it before starting fresh.',
      loadFailed: 'Could not load saved progress. Check disk access and try again.',
      exportCorruptBackup: 'Export backup',
      showBackupFolder: 'Show backup folder',
      retryLoad: 'Retry',
      startFreshAfterCorrupt: 'Start fresh',
      dismiss: 'Dismiss',
      boundaryTitle: 'Something went wrong',
      boundaryRecover: 'Unable to recover',
      boundaryReload: 'Reload App',
      boundaryExhausted: 'The application is unable to recover automatically.',
      boundaryTryAgain: 'Try Again',
    },
    stats: {
      title: 'Statistics',
      empty: 'Complete some quests to see practice trends and breakdowns here.',
      totalSessions: 'Sessions logged',
      practiceMinutesTotal: 'Practice minutes (logged)',
      activeDays: 'Days with practice',
      weeklyPractice: 'Minutes per week (Mon–Sun)',
      byCategory: 'Minutes by category',
      byDifficulty: 'Minutes by difficulty',
      topQuests: 'Most repeated quests',
      timesCompleted: 'Times',
      uncategorized: 'Uncategorized',
      speedRuns: 'Speed runs counted',
      weeklyInsight: 'This week: {quests} quests · {minutes} min of practice',
      weeklyQuests: 'quests',
      weeklyMinutes: 'min of practice',
      habitsTitle: 'Your habits',
      dailyStreak: 'Daily streak',
      bestStreak: 'Best: {days} days',
      chestProgress: 'Reward stars',
      weeklyChallengeStatus: 'Weekly challenge',
      weeklyChallengePending: 'Finish dailies to unlock',
      weeklyChallengeDone: 'Completed this week',
      practiceHeatmap: 'Practice calendar',
      practiceHeatmapHint: 'Darker cells = days you completed at least one quest (last 12 weeks).',
      practiceHeatmapAria: 'Practice activity over the last twelve weeks, {days} active days',
      streakExplainer:
        'Daily streak (above) counts finishing every daily quest. The heatmap shows any day you completed at least one quest.',
      skillRadar: 'Skill balance',
      skillRadarLevel: 'avg {level}',
      adaptiveDifficulty: 'Daily quest difficulty tuning',
      adaptiveFocusTags: 'Focus areas',
      adaptiveEasier: 'Recent sessions felt tough — daily picks favor easier quests.',
      adaptiveHarder: 'You are on a roll — daily picks may include harder quests.',
      adaptiveBalanced: 'Difficulty mix looks balanced for your recent pace.',
    },
    resources: {
      title: 'Materials',
      allCategories: 'All categories',
      skillNode: 'Skill node',
      allNodes: 'All nodes',
      tag: 'Tag',
      allTags: 'All tags',
      search: 'Search',
      searchPlaceholder: 'Title or tag…',
      noResults: 'No videos match these filters.',
      openBrowser: 'Open in browser',
      partnerChannels: 'Instructor channels',
      partnerChannelsHint: 'Your full partner list — open a channel to browse more uploads.',
      libraryStats: 'Curated entries in this build: {n} videos (expand the list in src/renderer/data/videoResources.ts).',
      myLibrary: 'My library',
      myLibraryHint:
        'Optional title overrides YouTube. The title and channel name are filled from YouTube when possible; tags combine the skill node’s tags with keywords from the title.',
      addYourLink: 'Add video',
      linkUrl: 'URL',
      linkUrlPlaceholder: 'https://…',
      linkTitleOptional: 'Title (optional)',
      customLinkTitlePlaceholder: 'Label for your library',
      addLink: 'Add to library',
      removeLink: 'Remove',
      invalidUrl: 'Enter a valid http(s) address.',
      catalogVideos: 'Catalog',
      favoriteAdd: 'Add to favorites — shown at top',
      favoriteRemove: 'Remove from favorites',
      addVideoNodeRequired: 'Choose a skill node in the filters before adding — your video is tied to that node.',
      nodeYoutubeSearchTitle: 'Global YouTube search for this node',
      contextTags: 'Topic tags from quest / skill node',
      searchPrefix: 'Search:',
      catalogLoading: 'Loading video library…',
      catalogExtendedLoading: 'Loading extended library…',
      catalogLoadError: 'Could not load the video catalog. Try reloading the page.',
      catalogFiltering: 'Updating results…',
      catalogMatchCount: 'Showing {shown} of {total}',
      catalogVirtualScrollHint: 'Scroll the list to browse all matches.',
      loadMoreVideos: 'Load {n} more',
      catalogCoreTitle: 'Start here',
      catalogMoreTitle: 'More videos',
      showMoreMaterials: 'Show {n} more videos',
      videoModeLong: 'Long',
      videoModeShort: 'Short',
      videoModeClipTips: 'CSP Tips',
      videoModeSketchfab: 'Sketchfab',
      videoModePinterest: 'Pinterest',
      clipTipsOpenHint: 'Open on Clip Studio TIPS',
      sketchfabOpenHint: 'Open 3D models on Sketchfab',
      pinterestOpenHint: 'Open pins on Pinterest',
      materialSourceGroup: 'Material sources',
      viewLearn: 'Learning now',
      viewCatalog: 'Full catalog',
      learnModeHint: 'A short set for your focus: theory, demo, and reference. Full catalog is in the second tab.',
      learnPrimary: 'Main lesson',
      learnShort: 'Short demo',
      learnReference: 'Reference',
      learnEmpty: 'Pick a skill node or tag in filters to get a tailored pack.',
      engagementViewed: 'Watched',
      engagementHelpful: 'Helpful',
      engagementApplied: 'Applied',
      engagementHint: 'Mark videos after watching — it tunes recommendations and achievements.',
      shortsOpenSearchLabel: 'Open search',
      youtubeShortsChannelLabel: 'YouTube Shorts search',
      catalogVideoUnit: 'videos',
      catalogMoreAvailable: 'more available',
      refWindowTitle: 'Materials',
      refWindowSearchPlaceholder: 'Search topic…',
      refWindowSearch: 'Search',
      refWindowOpenExternal: 'Open externally',
      referenceSourceSelector: 'Reference source',
      referenceSourcePinterest: 'Pinterest',
      referenceSourceYoutube: 'YouTube Long',
      referenceSourceArtstation: 'ArtStation',
      referenceSourceGoogle: 'Google Images',
      refWindowTags: 'Tags',
      refWindowAll: 'All',
      refWindowLoading: 'Loading…',
      refWindowEmpty: 'No materials. Try another search.',
      refWindowPaneLoading: 'Loading search…',
      addVideoYoutubeOnly: 'Only YouTube video links can be added to the catalog.',
      addingVideo: 'Fetching video info…',
      addVideoPanelIntro:
        'The video is saved for the skill node you selected above. It appears in the catalog when those filters match.',
      legacyImportedLinks: 'Imported links (pick a skill node to move them into the catalog)',
      legacyLinkBadge: 'Legacy',
    },
    desktop: {
      reminderTitle: 'ArtQuest',
      reminderBody: 'Time for a short practice session.',
    },
    reference: {
      title: 'Reference',
      search: 'Search references...',
      grid: 'Grid Overlay',
      pipette: 'Color Picker',
      ruleOfThirds: 'Rule of Thirds',
      goldenRatio: 'Golden Ratio',
      diagonal: 'Diagonal',
      opacity: 'Opacity',
      pickColor: 'Click on the image to pick a color',
      hex: 'Hex',
      rgb: 'RGB',
      hsl: 'HSL',
      copied: 'Copied!',
      noImage: 'No reference image selected',
      swatches: 'Saved Colors',
      clearSwatches: 'Clear All',
      savedHint: 'Save reference images for this quest — they stay on your device and come back next time you open it.',
      savedEmpty: 'No saved references yet. Paste from clipboard (Ctrl+V) or choose a file.',
      pasteHint: 'Paste an image from clipboard anywhere in this panel',
      addFromFile: 'Choose file',
      savedBadge: '{count} saved reference(s)',
    },
    onboarding: {
      welcomeTitle: 'Welcome to ArtQuest',
      welcomeIntro:
        'Your home screen is built around three daily quests, reward stars, and a portrait that grows with you. This tour walks through every main tab — click anywhere to continue.',
      clickToContinue: 'Click anywhere to continue',
      skillsTitle: 'Portrait & skill tracks',
      skillsBody:
        'Your character portrait and skill bars live here. Completing quests and practice fills XP across your visible skill directions.',
      dailiesTitle: 'Daily quests',
      dailiesBody:
        'Three quests each day — finish all of them to grow your streak and fill a reward star. After today’s dailies are done, a weekly challenge and a recommended quest appear on the home screen.',
      navTitle: 'Main navigation',
      navBody:
        'Home, Quests, Skills, Gallery, Resources, Progress, and Settings — open any section from this bar. Quest sessions and skill practice timers also appear here while you work.',
      questsTitle: 'Quest catalog',
      questsBody:
        'Browse the full library here. Filter by direction and difficulty, or add your own quest — no daily or weekly headers, just the catalog.',
      galleryTitle: 'Your gallery',
      galleryBody:
        'Every completed quest with uploaded work is saved here. Right-click a result to reveal it in the folder on disk.',
      skillsPageTitle: 'Skill tree',
      skillsPageBody:
        'Interactive skill tracks with icons on each node. Select a node to open practice, references, and the floating session widget.',
      skillsNodeDemoTitle: 'Node details',
      skillsNodeDemoBody:
        'The side panel shows level, XP, tags, and timed practice. Use it to deepen a track without starting a full quest.',
      statisticsTitle: 'Progress & statistics',
      statisticsBody:
        'Charts and habit summaries: streaks, reward stars, weekly challenge status, practice time, and category breakdowns.',
      resourcesTitle: 'Materials & videos',
      resourcesBody:
        'Curated clips tied to skill nodes, plus search, filters, favorites, and your own links.',
      achievementsTitle: 'Achievements',
      achievementsBody:
        'Milestones for streaks, quest counts, and hidden goals — check Progress → Achievements as you play.',
      goalsTitle: 'Your goal',
      goalsBody:
        'Set a personal goal on the dashboard — it stays visible as a daily reminder. Mark it completed when you finish.',
      materialsEngagementBody:
        'Use Learning now for focused picks tied to your progress, or browse the full catalog. Engagement chips remember what you opened.',
      settingsStorageBody:
        'Choose where gallery files live: local only, local + Google Drive, or cloud only. Connect Google Drive here to sync your works.',
      settingsTitle: 'Settings',
      settingsBody:
        'Storage mode (local / cloud), session widget, theme, language, sounds, and accessibility. Replay this full tour anytime from the button below.',
      skipTour: 'Skip tour',
      stepProgress: 'Step {current} of {total}',
      quickWelcomeIntro:
        'A quick walkthrough of the home screen — your level, daily quests, and how to submit work. Click anywhere to continue.',
      quickSkillsBody:
        'Your portrait and skill levels live here. XP from quests and practice fills these bars — the higher the level, the more you have trained that direction.',
      quickNextActionTitle: 'Best for today',
      quickNextActionBody:
        'Your personalized next step — warm-up, review, or recommended quest. This card updates daily and after each session.',
      quickDailiesBody:
        'Three fresh quests every day (new picks at midnight). Press «Take Quest», finish with the timer, upload your work — then earn a reward star.',
      quickNavBody:
        'Quests, Skills, Gallery, Resources, and Progress live in this bar — plus active quest and practice timers.',
      portraitStarsTitle: 'Reward star',
      portraitStarsBody:
        'Finish all daily quests to earn one reward star on the dashboard.',
      quickFullTourTitle: 'Want the full tour?',
      quickFullTourBody:
        'This button launches a detailed walkthrough of every section. Run it anytime — for now, click anywhere to start your first daily quest.',
    },
    levelUp: {
      title: 'Level up!',
      reachedLevel: 'Reached level {level}',
    },
    dayComplete: {
      title: 'Day complete!',
      streak: '{days}-day daily streak',
      bonus: '+{xp} bonus XP today',
      star: 'Reward star {current}/{total}',
      continue: 'Continue',
    },
    sessionRitual: {
      intentTitle: 'Practice session',
      durationLabel: 'Duration',
      focusLabel: 'Focus today',
      goalLabel: 'Your goal for this session',
      goalPlaceholder: 'e.g. clean lines on the warmup phase',
      startPractice: 'Start practice',
      exitTitle: 'Session closed',
      xpEarned: 'XP earned',
      practiceTime: 'Practice time',
      weakSpot: 'Watch next',
      nextStep: 'Suggested next step',
      viewGallery: 'View gallery',
      done: 'Done',
      chestTitle: 'Reward cycle complete!',
      chestBody: 'You filled all {days} reward stars this week. Streak shield earned.',
      chestClaim: 'Claim reward',
      reviewShelfTitle: 'Due for review',
      reviewOverdue: 'Last practiced {days} days ago — time to repeat',
      chapterTitle: 'Your chapter',
      chapterFoundation: 'Foundation: Drawing',
      chapterAnatomy: 'Chapter: Anatomy',
      chapterMotion: 'Chapter: Motion',
      chapterWeeks: '{weeks}-week arc',
      chapterComplete: 'complete',
      chapterContinue: 'Continue chapter',
      growthWallTitle: 'Growth wall',
      growthWallEmpty: 'Complete quests to build your growth timeline.',
      monthlySummaryTitle: 'This month',
      monthlySummaryQuests: '{count} quests completed',
      monthlySummaryMinutes: '{minutes} min practiced',
      monthlySummaryGrowth: 'Most growth: {category}',
      monthlySummaryMistake: 'Recurring focus: {tag}',
      energyModeLabel: 'Session length preference',
      energyModeHint: 'Shorter sessions prioritize quick quests in recommendations.',
      energyShort: 'Short (≤15 min)',
      energyMedium: 'Medium (≤30 min)',
      energyLong: 'Long (≤60 min)',
      ambientPresetLabel: 'Ambient sound preset',
      ambientRain: 'Rain',
      ambientCafe: 'Café crowd',
      ambientFireplace: 'Fireplace',
      studioThemeLabel: 'Dark 2',
      phaseWarmupDone: 'Warmup complete — core phase next',
      phaseCoreStart: 'Core phase — main exercise',
      phasePolishStart: 'Polish phase — refine your work',
    },
    upload: {
      dropZoneLabel: 'Upload your work',
      dropHint: 'Drag & drop, paste from clipboard, or choose a file',
    },
  },
  ru: {
    nav: {
      home: 'Главная',
      quests: 'Квесты',
      gallery: 'Галерея',
      skills: 'Навыки',
      statistics: 'Статистика',
      resources: 'Материалы',
      achievements: 'Достижения',
      progress: 'Прогресс',
      settings: 'Настройки',
      more: 'Ещё',
      primaryNav: 'Основная навигация',
    },
    progress: {
      title: 'Прогресс',
      timeline: 'Лента',
      calendar: 'Календарь',
      totalCompleted: 'Всего выполнено',
      currentStreak: 'Серия дней с квестами',
      bestStreak: 'Лучшая серия дней с квестами',
      practiceStreak: 'Серия практики',
      practiceStreakBest: 'Лучшая: {days} дн.',
      avgPerWeek: 'В среднем в нед.',
      days: 'дн.',
      questsOnDate: '{count} квестов выполнено {date}',
      noCompletions: 'Квесты ещё не выполнялись. Начните своё приключение!',
      completedOn: 'Выполнено {date}',
      goals: 'Цели',
      goalsEmpty: 'Выполненных целей пока нет. Отметьте цель на главной, когда достигнете её.',
      goalCompletedOn: 'Выполнено {date}',
      goalStartedOn: 'Начато {date}',
    },
    portrait: {
      settingsTitle: 'Портрет персонажа',
      settingsHint: 'Выберите базовый образ для аватара на главной. Свои файлы — в public/portraits/.',
      genderMale: 'Мужской',
      genderFemale: 'Женский',
      chestHint: 'Выполняйте все ежедневные квесты — одна звезда за день. Заполните все пять звёзд, чтобы завершить цикл.',
      rewardStarsLabel: 'Ежедневная награда · {current}/{total}',
      streakShieldAvailable: 'Щит серии готов — защитит один пропущенный день в этом месяце',
      streakShieldUsed: 'Щит серии использован — прогресс сохранён!',
      streakShieldUsedThisMonth: 'Щит использован в этом месяце',
      streakShieldLabel: 'Щит серии',
      customAvatarCropTitle: 'Обрезка аватара',
      customAvatarCropHint: 'Перетаскивайте для перемещения, колёсико или +/- для масштаба. На дашборде будет видна только квадратная область.',
      customAvatarConfirm: 'Использовать фото',
      customAvatarDoubleClickHint: 'Дважды нажмите, чтобы выбрать своё фото для аватара',
      customAvatarClickHint: 'Нажмите, чтобы выбрать своё фото для аватара',
      customAvatarZoomIn: 'Увеличить',
      customAvatarZoomOut: 'Уменьшить',
    },
    common: {
      back: 'Назад',
      details: 'Подробнее',
      completed: 'Выполнено',
      startQuest: 'Взять квест',
      cancel: 'Отказаться',
      submit: 'Сдать работу',
      save: 'Сохранить',
      selectFile: 'Выбрать файл',
      complete: 'Завершить',
      allQuests: 'Все квесты',
      xp: 'XP',
      minutes: 'мин',
      category: 'Категория',
      source: 'Источник',
      difficulty: 'Сложность',
      timeRemaining: 'Осталось времени',
      pauseQuest: 'Пауза',
      resumeQuest: 'Продолжить',
      resetProgress: 'Сбросить прогресс',
      cancelConfirm: 'Точно отменить квест?',
      resetConfirm: 'Вы уверены, что хотите сбросить весь прогресс?',
      resetSuccess: 'Прогресс сброшен',
      noQuestsFound: 'Квесты не найдены для этих фильтров',
      noQuestsHint: 'Измените направление или сложность в фильтрах или снимите теги (если открыто по ссылке с тегами).',
      loadingRoute: 'Загрузка…',
      appLoading: 'Загрузка ArtQuest…',
      loading: 'Загрузка…',
      questsLoadError: 'Не удалось загрузить данные квестов. Пожалуйста, перезапустите приложение.',
      questNotFound: 'Квест не найден',
      confirm: 'Подтвердить',
      open: 'Открыть',
      close: 'Закрыть',
      previousPage: 'Предыдущая страница',
      nextPage: 'Следующая страница',
      removeUpload: 'Удалить загрузку',
      abandonQuestTitle: 'Отменить квест?',
      abandonQuestBody: 'Прогресс текущей сессии будет потерян.',
      attachmentRequired: 'Прикрепите работу, чтобы завершить квест.',
      submitFailed: 'Не удалось сдать квест. Попробуйте ещё раз.',
      submitFailedSave: 'Не удалось сохранить работу. Проверьте место на диске и повторите.',
      submitAlreadyCompleted: 'Этот квест уже выполнен — повторная сдача недоступна.',
      submitPartialUpload: 'Некоторые файлы не удалось сохранить. Квест засчитан с успешно загруженными файлами.',
      submitStorageFull: 'Не удалось сохранить прогресс — хранилище переполнено. Экспортируйте прогресс и освободите место.',
      gotIt: 'Понятно',
      retry: 'Повторить',
      continue: 'Далее',
      secondsAbbr: 'сек',
    },
    a11y: {
      skipToMain: 'Перейти к основному содержимому',
      mainNavigation: 'Главная навигация',
      appHome: 'ArtQuest — главная',
      questCard: 'Квест: {title}',
      difficultyBadge: 'Сложность: {label}',
      questActions: 'Действия с квестом',
      viewQuestDetails: 'Подробнее о квесте «{title}»',
      questCompletedStatus: 'Квест «{title}» выполнен',
      startQuestNamed: 'Начать квест «{title}»',
      zoneMap: 'Карта зоны',
      uploadPreviewVideo: 'Предпросмотр загруженной работы',
    },
    difficulty: {
      novice: 'Новичок',
      intermediate: 'Средний',
      advanced: 'Продвинутый',
      master: 'Мастер',
      expert: 'Эксперт',
      all: 'Все',
    },
    skills: {
      title: 'Навыки',
      level: 'Уровень',
      maxXp: 'Макс. XP',
      available: 'Доступен',
      in_progress: 'В процессе',
      review: 'Повторение',
      mastered: 'Освоено',
      start_practice: 'Практика с таймером',
      repeat: 'Повторить',
      interval: 'Интервал',
      days: 'дней',
      practiceElapsed: 'Время сессии',
      pausePractice: 'Пауза',
      resumePractice: 'Продолжить',
      endPractice: 'Завершить и начислить XP',
      practiceHint: 'Таймер идёт вверх. Когда закончили рисовать — нажмите завершить: время переводится в XP этого узла.',
      practiceInProgress: 'Сначала завершите текущую практику',
      practiceComplete: 'Практика завершена!',
      requires: 'Требует',
      resources: 'Материалы и видео',
      nodeMasteredHint: 'Узел освоен! Практикуйся дальше для престижа.',
      maxPrestigeReached: '🌟 Максимальный престиж достигнут!',
      activePractice: 'Активная практика',
      practiceMinimizedHint: 'Таймер идёт — откройте ноду снова или используйте виджет в навбаре.',
      practiceMinArtAppHint: 'Минимум 1 мин в программе',
      practiceArtAppPausedHint: 'Таймер на паузе — вернитесь в программу для рисования.',
      collapseToWidget: 'Свернуть в виджет',
      practiceConfirmTitle: 'Запустить практику?',
      practiceConfirmMessage: 'Таймер практики начнёт идти, когда вы откроете материалы. Продолжить?',
      cancelPractice: 'Отмена',
      emptyHint: 'Выполняйте ежедневные квесты на главной — XP квестов открывает узлы навыков.',
      emptyCta: 'На главную',
      nextUnlock: 'Следующий unlock',
      nextPracticeHint: 'Рекомендуемая тренировка для этой ветки сейчас.',
      stretchReminderTitle: 'Ты молодец!',
      stretchReminderBody: 'Пора встать и немного размяться.',
    },
    categories: {
      drawing: 'Рисование',
      anatomy: 'Анатомия',
      animation: 'Анимация',
      effects: 'Эффекты',
      storytelling: 'Сторителлинг',
      character_design: 'Дизайн персонажей',
      environment: 'Окружение',
    },
    dashboard: {
      title: 'Практика',
      totalLevel: 'Общий уровень',
      activeQuest: 'Активный квест',
      dailyQuests: 'Ежедневные квесты',
      dailyCompleted: 'Ежедневные квесты выполнены!',
      streak: 'дней',
      questsToday: 'квестов',
      completed: 'выполнено',
      strengthens: 'Укрепляет',
      startPractice: 'Начать практику',
      practiceRefsConfirmTitle: 'Запустить таймер практики?',
      practiceRefsConfirmMessage: 'При открытии материалов начнётся сессия практики и таймер. Продолжить?',
      streakRecoveryBanner:
        'Щит стрика: сегодня нужно выполнить 4 ежедневных квеста — вы пропустили один день. После этого снова будет 3 квеста в день.',
      streakRecoveryStartHint:
        'Вы пропустили вчерашние дейлики. Щит серии защищает прогресс — выполните сегодня {count} квестов, чтобы сохранить серию.',
      recommendedQuest: 'Рекомендуем сейчас',
      recommendedDailyHint: 'Закройте сегодняшнюю тройку дейликов',
      recommendedWeakHint: 'Подкачайте самый слабый трек навыков',
      dailyQuestsPartialHint: 'Сегодня доступно только {available} из {expected} ежедневных квестов — пройдите больше квестов в каталоге или прокачайте навыки.',
      dailyQuestsEmptyHint: 'Сейчас нет доступных ежедневных квестов. Откройте каталог или повторите практические квесты.',
      today: 'Сегодня',
      todayPracticeFocus: 'Практика на сегодня',
      nextBestActionLabel: 'Следующий шаг',
      reviewShelfAllCaughtUp: 'Всё актуально — повторять пока нечего.',
      reviewTitle: 'Навыки на повторение',
      reviewHint: 'Освежите эти треки, чтобы прогресс не угасал.',
      reviewCta: 'Открыть навыки',
      xpEconomyHint: 'XP квеста идёт в дерево навыков; учитываются бонусы и время.',
      continueQuest: 'Продолжить квест',
      continueSkillPractice: 'Продолжить практику',
      dailyStreakDays: 'дн.',
      todayCompleteTitle: 'Сегодня выполнено!',
      todayCompleteBody: 'Вы закрыли все ежедневные квесты. Отличная работа — до завтра!',
      tomorrowPreviewBody: 'Завтра в дейликах могут быть: {categories}',
      reviewDueBadge: 'Пора повторить',
      weakestCriterionTitle: 'Фокус на неделе',
      weakestCriterionBody: 'По самооценке стоит подтянуть: {criterion}',
      shareProgress: 'Поделиться прогрессом',
      allSkillsLink: 'Все навыки →',
      nextActionTitle: 'Сегодня лучше всего',
      learningPlanTitle: 'План на сегодня',
      nextActionDailyReason: 'Выполнено {done}/{total} дейликов — закройте сегодняшнюю тройку для стрика и звёзд.',
      nextActionDailyBadge: 'Ежедневный квест',
      nextActionMistakeReason: 'Подбор по частым ошибкам из последних работ.',
      nextActionSecondaryTitle: 'Дополнительная практика',
      nextActionSecondaryCta: 'Начать фокус-квест',
      nextActionSkillReviewTitle: 'Повторение навыка',
      nextActionSkillReviewReason: 'Узел просрочен на {days} дн. — освежите трек в «Навыках».',
      nextActionMaterialsTitle: 'Материалы по вашему фокусу',
      nextActionImprovementReason: 'По заметкам в галерее — закрепите слабое место практикой.',
      nextActionWarmupReason: 'Короткая разминка — лучший способ начать день.',
      nextActionReviewReason: 'Пора повторить — интервальное закрепление.',
      nextActionStartWarmup: 'Начать 5 мин',
      nextActionStartFundamentals: 'Начать основы',
      nextActionFundamentalsReason:
        'Пройдите одно упражнение из «Основы», чтобы открыть ежедневные квесты.',
      nextActionOpenMaterials: 'Открыть материалы',
      learningPlanFundamentalsTitle: 'Упражнение «Основы»',
      learningPlanFundamentalsReason: 'Пройдите одно упражнение из «Основы», чтобы открыть ежедневные квесты.',
      learningPlanFundamentalsReasonShort: 'Следующий шаг на пути основ.',
      learningPlanWarmupTitle: '5-минутная разминка',
      learningPlanWarmupReason: 'Короткий старт без штрафов — разогрев перед основной практикой.',
      learningPlanWarmupReasonShort: 'Начните с короткой сессии.',
      learningPlanDailyTitle: 'Ежедневный квест',
      learningPlanDailyReason: 'Сегодня {done}/{total} — закройте дейлики для стрика и звёзд.',
      learningPlanQuestReviewTitle: 'Повторение квеста',
      learningPlanQuestReviewReason: 'Интервальное повторение — закрепите навык, пока он свежий.',
      learningPlanRecommendedTitle: 'Рекомендуемая практика',
      learningPlanRecommendedWeakCriterion: 'По самооценке стоит подтянуть: {criterion}.',
      learningPlanRecommendedMistake: 'Подбор по частым ошибкам из последних работ.',
      learningPlanRecommendedImprovement: 'По заметкам в галерее — закрепите слабое место.',
      learningPlanRecommendedWeakest: 'Подкачайте самый слабый трек навыков.',
      learningPlanSkillReviewReason: 'Узел навыка просрочен на {days} дн. — освежите трек.',
      learningPlanMaterialsTitle: 'Материалы по слабому месту',
      learningPlanMaterialsReason: 'Теория и примеры: {criterion}.',
      learningPlanDailyNextHint: 'Далее: ежедневные квесты ниже ({done}/{total}).',
      scrollToDailies: 'Скрол вниз к дейликам ↓',
      showAll: 'Показать все',
      showLess: 'Свернуть',
      goalTitle: 'Цель',
      goalHint: 'Напишите, чего хотите добиться с ArtQuest — это будет напоминать вам каждый день.',
      goalPlaceholder: 'Например: нарисовать полный character sheet за 30 дней',
      goalSave: 'Сохранить цель',
      goalEdit: 'Изменить',
      goalComplete: 'Отметить как выполненную',
      goalNewPlaceholder: 'Какая ваша следующая цель?',
      goalsHistoryLink: 'Смотреть {count} выполненных целей →',
    },
    quests: {
      title: 'Квесты',
      dailyQuests: 'Ежедневные квесты',
      allQuests: 'Все квесты',
      viewRecommended: 'Рекомендуемые',
      viewAll: 'Весь каталог',
      watchFirst: 'Сначала посмотреть',
      quickDifficulty: 'Насколько было сложно?',
      skipMicroSteps: 'Пропустить микро-шаги',
      microStepsRequired: 'Завершите микро-шаги или пропустите (только novice)',
      dailyCompleted: 'Ежедневные квесты выполнены!',
      questCompleted: 'Квест выполнен!',
      minLevel: 'Требуемый уровень',
      medium: 'Формат',
      mediumTraditional: 'Традиционные материалы',
      mediumDigital: 'Цифровой',
      mediumBoth: 'Традиционный и цифровой',
      startSession: 'Начать сессию с таймером',
      referenceGuideTitle: 'Референс и подсказки',
      materials: 'Материалы',
      sessionRefsTitle: 'Ваши референсы',
      sessionRefsHint: 'Прикрепите картинки для этой сессии — они остаются на устройстве и не отправляются с работой.',
      attachReference: 'Добавить референс',
      weeklyChallenge: 'Недельный вызов',
      weeklyChallengeHint: 'Один более сложный квест в неделю — бонус XP за выполнение.',
      weeklyChallengeDone: 'Выполнено на этой неделе',
      weeklyChallengeCta: 'Принять недельный вызов',
      weeklyChallengeLockedHint: 'Выполните сегодняшние ежедневные квесты, чтобы открыть недельный вызов.',
      dailyProgressToday: '{done}/{total} дейликов сегодня',
      prerequisiteLocked: 'Заблокировано',
      prerequisiteRequires: 'Сначала выполните:',
      xpBreakdownTitle: 'Как начисляется XP',
      xpBreakdownQuest: 'XP квеста — legacy-трек зависит от времени практики (25–100% от номинала относительно длины сессии).',
      xpBreakdownSkill: 'Узел навыка — 20% от XP квеста плюс минуты практики (меньше при speed run).',
      xpBreakdownPhase: 'Фазы сессии — небольшой XP узла навыка за каждый шаг (до 30% от XP квеста).',
      lastPracticeNotes: 'Ваши заметки с прошлого раза',
      microChallenges: 'Быстрые упражнения',
      microChallengesSessionHint: 'Шаги идут по очереди в сессии — переходите к следующей фазе, когда будете готовы.',
      microChallengeCompleted: 'Шаг выполнен',
      sessionPlanTitle: 'План сессии',
      phaseLabelWarmup: 'Разминка',
      phaseLabelCore: 'Основа',
      phaseLabelPolish: 'Полировка',
      phaseLabelStep: 'Шаг',
      phaseSelfCheckLabel: 'Я выполнил цель этого шага и готов к следующей фазе',
      locked: 'Заблокировано — выполните предыдущее упражнение',
      sessionPhaseNext: 'Далее',
      sessionCurrentPhase: 'Фаза {current} из {total}',
      sessionTotalRemaining: 'Осталось всего',
      sessionPhasesComplete: 'Все фазы упражнений пройдены — доработай работу и отправь результат.',
      phaseMediaAdd: 'Добавить референс',
      phaseMediaDrop: 'Перетащите картинку или GIF сюда, или нажмите для выбора',
      phaseMediaHint: 'Изображение или GIF для этого шага — сохранится на следующий раз.',
      sessionPhaseTotal: '{count} фаз · {minutes} мин всего',
      referencePhaseLabel: 'Сбор референсов — просмотри и собери вдохновение',
      timerExpired: 'Время вышло — работайте столько, сколько нужно. Завершите и отправьте работу, когда будете готовы.',
      timerExpiredCta: 'Сохранить работу',
      gracePeriodHint: 'Дополнительное время: осталось {time}',
      overtimeHint: 'Доп. время: {time}',
      overtimeXpNote: 'XP трека квеста слегка снижается после таймера; XP узла навыка считается по реальному времени практики.',
      typicalTimeLabel: 'обыч.',
      lastCompletionTimeLabel: 'Прошлый раз',
      timeoutFailTitle: 'Квест не выполнен вовремя',
      timeoutFailBody:
        'К сожалению, ты не успел выполнить квест. Будет получен опыт только в ячейку древа навыков. Удачи со следующим квестом!',
      timeoutFailCta: 'На дашборд',
      timerMainLabel: 'Время квеста',
      timerReferenceLabel: 'Время на референсы',
      needReferences: 'Нужны референсы?',
      overlayReference: 'Референс',
      overlayCancelQuest: 'Отменить',
      referenceYoutube: 'YouTube',
      referenceYoutubeLong: 'Длинные',
      referenceYoutubeShort: 'Короткие',
      referencePinterest: 'Pinterest',
      referenceClipTips: 'CSP Tips',
      referenceSketchfab: 'Sketchfab',
      referenceBonusAdded: 'Для референсов добавлено {n} мин.',
      sessionOverlayEmptyHint: 'Начните квест или практику — таймер появится здесь.',
      sessionOverlayExpandAria: 'Открыть главное окно',
      warmupSessionHint: 'Раз в день · 5 минут · один таймер',
      fundamentalsSessionHint: 'Следуйте шагам выше. Загрузите работу по окончании таймера.',
      fundamentalsStepsTitle: 'Шаги',
      reflectionCriteriaHint: 'Оцените, что получилось (необязательно)',
      submitMistakeTagsHint: 'Выбери что не получилось. (до 3 штук)',
      submitMistakeTagsRequired: 'Выберите хотя бы одну сложную область (обязательно при оценке 4–5).',
      submitMistakeTagsHardHint: 'Назовите самую трудную часть — так практика завтра станет точнее.',
      learningHintFocusSuffix: ' · Фокус: {tags}',
      submitUploadFirstHint: 'Загрузите работу слева, затем оцените сложность — дальше появится блок качества или ошибок.',
      learningHintLine: 'Тренирует: {skill} · {category} · ~{minutes} мин · {outcome}',
      startQuestNow: 'Начать квест',
      repeatableQuest: 'Можно повторять — начните новую сессию в любой момент.',
      sessionModeTitle: 'Режим сессии',
      sessionModeSubtitle: 'Таймер и сдача работы здесь же.',
      sessionNotesLabel: 'Заметки по работе',
      sessionNotesPlaceholder: 'Что получилось? Что исправить в следующей сессии?',
      workCommentLabel: 'Комментарий к работе',
      workCommentPlaceholder: 'Необязательно — будет виден в галерее вместе с работой',
      addQuest: 'Добавить квест',
      addQuestTitle: 'Создать свой квест',
      addQuestHint: 'Награды пересчитываются по мере ввода названия — сравнение с квестами из библиотеки.',
      addQuestNameLabel: 'Название квеста',
      addQuestSkillLabel: 'Навык',
      addQuestDescLabel: 'Заметки для себя',
      addQuestDescOptional: '(необязательно)',
      addQuestDescPlaceholder: 'Доп. контекст для вас — на XP и время не влияет',
      addQuestSubmit: 'Добавить в библиотеку',
      addQuestValidation: 'Укажите название квеста.',
      addQuestDetectedSkill: 'Навык: {skill}',
      addQuestEstimateTitle: 'Расчёт наград',
      addQuestSkillXpLine: '~{xp} XP в дерево навыков при полной сессии',
      addQuestBreakdownSemantic: 'По смыслу названия: {xp} XP · {min} мин',
      addQuestBreakdownCatalog: 'Совпадение с библиотекой ({pct}%): {xp} XP · {min} мин',
      addQuestBreakdownVolume: 'Объём в названии: ×{mult}',
      addQuestConfidenceHigh: 'Точное совпадение',
      addQuestConfidenceMedium: 'Частичное совпадение',
      addQuestConfidenceLow: 'Слабое совпадение',
      addQuestConfidenceSemantic: 'Только по названию',
      addQuestMatchedReference: 'Ближайший квест ({score}%): «{title}»',
      addQuestUnderstood: 'Учитываем в задаче: {signals}',
      editTitleLabel: 'Изменить название',
      editTitleSave: 'Сохранить',
      editTitleReset: 'Вернуть оригинал',
      editTitleLangHint: 'Сохраняется только для текущего языка интерфейса.',
      deleteQuest: 'Удалить квест',
      deleteQuestTitle: 'Удалить этот квест?',
      deleteQuestConfirm:
        'Квест будет навсегда удалён из библиотеки — и встроенный, и созданный вами. Прогресс и работы в галерее по этому квесту тоже удалятся.',
      feedbackTitle: 'Как вам этот квест?',
      feedbackDifficulty: 'Сложность',
      feedbackDifficultyHint: 'Было слишком легко или сложно?',
      feedbackQuality: 'Оценка качества',
      feedbackLineConfidence: 'Уверенность линии',
      feedbackProportion: 'Пропорции',
      feedbackValueRange: 'Тональный диапазон',
      feedbackComposition: 'Композиция',
      feedbackTiming: 'Тайминг',
      feedbackPose: 'Поза',
      feedbackOptionalNote: 'Заметки (необязательно)',
      feedbackSkip: 'Пропустить',
      feedbackSubmit: 'Сохранить',
      feedbackSaved: 'Оценка сохранена!',
    },
    rewards: {
      title: 'Награда',
      questXp: 'в навык',
      playerXp: 'XP игрока',
      skillXp: 'узел навыка',
      category: 'категория',
      dismiss: 'Закрыть',
      skillXpRenownHint:
        'Legacy-трек получает полный XP квеста при завершении. Узел — 20% плюс время практики.',
      dailyBonusLine: 'Бонус за все дейлики',
      weeklyBonusLine: 'Бонус недельного челленджа',
    },
    achievements: {
      title: 'Достижения',
      unlocked: 'Разблокировано!',
      unlockProgress: '{unlocked} / {total} разблокировано',
      allUnlocked: 'Поздравляем! Вы разблокировали все достижения!',
      achievementUnlocked: 'Достижение разблокировано!',
      secretRemainingOne: 'Осталось 1 секретное достижение',
      secretsRemaining: 'Осталось {n} секретных достижений',
      endgameBadge: 'Эндгейм',
    },
    gallery: {
      empty: 'Нет выполненных квестов.',
      emptyHint: 'Завершайте квесты и загружайте фото или видео результатов — они появятся здесь.',
      allQuestsBtn: 'Все квесты',
      dailyQuestsBtn: 'Ежедневные квесты',
      versions: 'версий',
      showLatest: 'Показать последнюю',
      showAll: 'Показать все',
      before: 'До',
      after: 'После',
      selectTwo: 'Выберите две версии для сравнения',
      categoryBadge: 'Трек',
      collapse: 'Свернуть',
      expand: 'Развернуть',
      loading: 'Загрузка…',
      stepLabel: 'Шаг {n}',
      showInFolder: 'Показать в папке',
      showInFolderDisabled: 'Файл не сохранён локально',
      unknownQuest: 'Неизвестный квест',
      lightboxPrev: 'Предыдущее изображение',
      lightboxNext: 'Следующее изображение',
      viewGrouped: 'Стена роста',
      viewGrid: 'Сетка',
      viewCompact: 'Список',
      sortNewest: 'Сначала новые',
      sortOldest: 'Сначала старые',
      scopeAllTime: 'За всё время',
      scopeToday: 'За сегодня',
      workComment: 'Комментарий',
      cloudUploaded: 'Загружено',
      cloudPending: 'Ожидает загрузки',
      cloudFailed: 'Ошибка загрузки',
      filterAllCategories: 'Все категории',
      redoQuest: 'Повторить квест',
      improvementNotes: 'Улучшить в следующий раз',
      mistakeTagsLabel: 'Что не получилось:',
      compareVersions: 'Сравнить до / после',
      practiceNext: 'Следующая практика',
      shareStory: 'Поделиться (сторис)',
      whatWentWellPlaceholder: 'Что получилось…',
      searchPlaceholder: 'Поиск по работам, тегам, заметкам',
      searchAria: 'Поиск по галерее',
      filterEmpty: 'Нет работ по этим фильтрам',
      favoritesOnly: 'Избранное',
      favoriteOn: '★ В избранном',
      favoriteOff: '☆ В избранное',
    },
    settings: {
      title: 'Настройки',
      sound: 'Звук',
      enableSounds: 'Включить звуки уведомлений',
      volume: 'Громкость',
      testSound: 'Проверить звук',
      ambientEnabled: 'Фоновый эмбиент',
      ambientVolume: 'Громкость фона',
      language: 'Язык',
      selectLanguage: 'Выберите язык',
      favoriteCategories: 'Любимые категории',
      favoriteCategoriesHint: 'Выберите до 3 категорий для ежедневных квестов (один квест на категорию). При смене категорий ежедневные квесты на дашборде обновляются.',
      randomCategories: 'Полностью случайные категории',
      randomCategoriesHint: 'Игнорировать любимые — каждый день выбирать 3 случайные категории.',
      selectUpToThree: 'До 3 любимых — ежедневные квесты на дашборде зависят от них',
      desktopSection: 'Рабочий стол и напоминания',
      questShortcutsSection: 'Горячие клавиши сессии',
      questShortcutsHint: 'Работают во время активной сессии (Electron). Нажмите кнопку и введите нужную клавишу или сочетание.',
      shortcutAdvance: 'Следующая фаза',
      shortcutOverlay: 'Показать / скрыть виджет',
      shortcutOpenReferences: 'Окно референсов',
      shortcutShowMain: 'Главное окно',
      shortcutReset: 'Сброс',
      shortcutResetAll: 'Сбросить все',
      shortcutCaptureListening: 'Нажмите клавиши…',
      shortcutCaptureClick: 'Нажмите для назначения',
      breakReminderTitle: 'Пауза для глаз: 20-20-20',
      breakReminderBody: 'Посмотри на объект в 6 метрах примерно 20 секунд. XP не штрафуется.',
      breakReminderDone: 'Готово',
      devToolsTitle: 'Для разработки',
      devAdvanceDayHint: 'Перемотка на 1 день вперёд',
      devDateShifted: '✓ Дата сдвинута на {date}',
      devDayPlusOne: 'День +1',
      artIdleSecondsUnit: 'сек',
      artAppsSection: 'Отслеживание программ',
      artAppsHint: 'Опыт и таймер идут только когда выбранная программа активна и вы не бездействуете.',
      artAppsHintOff: 'Отключено: время идёт, пока приложение открыто (без проверки фокуса).',
      artAppsEnabled: 'Включить отслеживание',
      artAppsPlatformNote:
        'Определение активной art-программы доступно только в Windows. На macOS и Linux время практики засчитывается, пока открыт ArtQuest.',
      artAppsCustom: 'Другое',
      artAppsCustomPath: 'Выбранное приложение',
      artAppsCustomChange: 'Изменить…',
      artIdleTimeout: 'Пауза при бездействии',
      minimizeToTray: 'Оставаться в фоне при закрытии окна (значок в трее)',
      sessionWidgetMode: 'Режим виджета',
      sessionWidgetModeHint:
        'После начала квеста или практики нажмите «Свернуть в виджет» на экране сессии — откроется плавающий таймер. Автоматического сворачивания нет.',
      openAtLogin: 'Запускать ArtQuest при входе в систему',
      reminders: 'Напоминание о практике раз в день (локальное время)',
      remindersHint: 'Одно системное уведомление около выбранного времени в календарный день.',
      reminderTime: 'Время напоминания',
      testNotification: 'Проверить уведомление',
      accessibilitySection: 'Доступность',
      fontScale: 'Размер текста',
      fontSmall: 'Мелкий',
      fontMedium: 'Обычный',
      fontLarge: 'Крупный',
      highContrast: 'Повышенный контраст поверхностей',
      reduceMotion: 'Уменьшить анимации',
      telemetryEnabled: 'Анонимная диагностика (только локально)',
      vfxQuality: 'Эффекты наград',
      vfxQualityOff: 'Только CSS',
      vfxQualityNormal: 'Обычные',
      vfxQualityEnhanced: 'Усиленные',
      disableSessionTimers: 'Отключить таймеры',
      disableSessionTimersHint:
        'Остановить обратный отсчёт в квестах и тренировках навыков. Завершайте практику в своём темпе.',
      tourAndResetSection: 'Тур и сброс',
      showWelcomeTipsAgain: 'Показать приветствие снова',
      fullAppTour: 'Полный тур по приложению',
      theme: 'Тема',
      themeModern: 'Тёмная',
      themeLight: 'Светлая',
      themeRpg: 'Тёмное фэнтези',
      themeStudio: 'Тёмная 2',
      widgetSection: 'Режим виджета',
      storageSection: 'Хранилище',
      storageLocal: 'Только локально',
      storageCloud: 'Облачное хранилище',
      storageLocalAndCloud: 'Локально и облако',
      storageCloudOnly: 'Только облако',
      storageLocalHint: 'Выберите, где хранить результаты квестов. Превью в галерее остаются даже в режиме «только облако».',
      personalizationSection: 'Персонализация',
      technicalSection: 'Технические настройки',
      referenceSourceTitle: 'Источник референсов по умолчанию',
      referenceSourceHint: 'Окно референсов открывается с этим источником и запоминает последний выбранный источник.',
      useGoogleForReferenceLogin: 'Google-аккаунт для сайтов референсов',
      useGoogleForReferenceLoginHint:
        'Если Google Drive подключён, вход на Pinterest и другие сайты референсов через Google с аккаунтом {email}.',
      useGoogleForReferenceLoginBtn: 'Войти через Google ({email})',
      referencesSection: 'Референсы и материалы',
      appearanceSection: 'Внешний вид и звук',
      dataSection: 'Данные и синхронизация',
      googleDrive: 'Google Drive',
      connectGoogle: 'Подключить Google',
      disconnectGoogle: 'Отключить',
      connected: 'Подключено',
      notConnected: 'Не подключено',
      googleDrivePath: 'Путь сохранения на Google Drive',
      googleDrivePathHint: 'По умолчанию: /ArtQuest/Gallery. ArtQuest использует минимальный доступ drive.file.',
      retryCloudUpload: 'Повторить неудачные загрузки',
      cloudSync: 'Синхронизация',
      cloudSyncDone: 'Синхронизация завершена. Загружено: {downloaded}, отправлено: {uploaded}, связано: {linked}.',
      googleDriveOpenFolder: 'Открыть папку на Google Drive',
      googleDriveCloudHint:
        'Файлы сохраняются в облаке Google Drive (Мой диск → ArtQuest → Gallery). В локальную папку Google Drive на компьютере они не копируются.',
      googleDriveFolderPending: 'Сначала нажмите «Синхронизация», чтобы создать или найти папку на Google Drive.',
      googleDriveReconnectRequired:
        'Доступ к Google Drive не был выдан для этого токена. Нажмите «Отключить», затем «Подключить Google» снова и разрешите доступ к файлам Drive.',
      cloudUploadRetryStarted: 'Очередь загрузки перезапущена. Откройте Галерею и проверьте статус.',
      cloudUploadRetryDone: 'Все ожидающие загрузки завершены.',
      cloudSecurityHint:
        'Облачная загрузка включается только вручную. OAuth с PKCE и доступом drive.file (только файлы ArtQuest). Токены шифруются DPAPI в main-процессе и не передаются в renderer.',
      privacyLocalOnly: 'Внешней аналитики нет. События практики остаются на этом устройстве.',
      backupSection: 'Резервная копия',
      exportProgress: 'Экспорт прогресса',
      importProgress: 'Импорт прогресса',
      exportProgressHint: 'Сохранить прогресс в JSON. Файлы галереи остаются на диске, если не включить медиа.',
      lastExportAt: 'Последний экспорт',
      importSuccess: 'Прогресс успешно импортирован.',
      importFailed: 'Не удалось импортировать файл.',
      exportFailed: 'Не удалось экспортировать.',
      exportSuccess: 'Прогресс экспортирован.',
      storageUpdateFailed: 'Не удалось обновить хранилище.',
      syncFailed: 'Синхронизация не удалась.',
      includeMediaExport: 'Включить медиа галереи в экспорт',
    },
    character: {
      novice: 'Новичок',
      apprentice: 'Ученик',
      journeyman: 'Подмастерье',
      master: 'Мастер',
      legend: 'Легенда',
    },
    profile: {
      welcomeTitle: 'Добро пожаловать в ArtQuest',
      welcomeIntro: 'С чего хотите начать?',
      chooseDrawing: 'Рисование',
      chooseAnimation: 'Анимация',
      changeLaterHint: 'Профиль можно сменить в настройках.',
      artistRole: 'Художник',
      animatorRole: 'Аниматор',
      settingsTitle: 'Профиль обучения',
      settingsHint: 'Рисование скрывает квесты и навыки анимации. Анимация оставляет все направления открытыми.',
      drawingFocus: 'Фокус на рисовании',
      animationFocus: 'Вся библиотека (включая анимацию)',
      avatarTitle: 'Выберите персонажа',
      avatarIntro: 'Портрет будет на главном экране — нажмите вариант слева или справа.',
      artAppsTitle: 'Какими программами вы пользуетесь?',
      artAppsIntro: 'Время практики засчитывается, когда активна одна из выбранных программ. Список можно изменить в настройках.',
      experienceTitle: 'Оцените свой уровень',
      experienceIntro: 'Если вы уже практикуетесь, мы пропустим самые простые упражнения.',
      experienceBeginner: 'Новичок',
      experienceBeginnerHint: 'Фазовые треки основ; дейлики откроются после первого упражнения',
      experienceBeginnerFundamentalsHint:
        'Вы начнёте с пофазных упражнений «Основы». Ежедневные квесты откроются после первого.',
      experienceIntermediate: 'Продолжающий',
      experienceIntermediateHint: 'Пропустить самые лёгкие задания',
      experienceAdvanced: 'Опытный',
      experienceAdvancedHint: 'Фокус на средних и сложных квестах',
      experienceSettingsTitle: 'Уровень навыков',
      experienceSettingsHint: 'Влияет на сложность дейликов и рекомендации.',
      experienceChangeWarning: 'При смене уровня пересчитаются сегодняшние дейлики.',
      chooseExplore: 'Свободная игра',
      explorePathHint: 'Все квесты в своём темпе',
    },
    fundamentals: {
      title: 'Основы',
      pageIntro:
        'Фазовые треки «Новичок» и «Средний» и отдельные продвинутые упражнения — линия, формы и воображение.',
      progressHint: 'Выполнено {done}/{total} упражнений',
      gateHint:
        'Пройдите одно упражнение из раздела «Основы», чтобы открыть ежедневные квесты.',
      gateUnlocked: 'Ежедневные квесты открыты — продолжайте путь до конца!',
      dailyLockedHint: 'Сначала пройдите одно упражнение из раздела «Основы».',
      viewAll: 'Все упражнения',
      upNext: 'Далее',
      startCta: 'Начать основы',
      continueCta: 'Продолжить основы',
      trackPhaseProgress: '{done}/{total} фаз',
      uploadOptionalHint: 'Загрузка необязательна — можно завершить без файла.',
      pathComplete: 'Вы прошли все упражнения основ!',
      locked: 'Сначала завершите предыдущее упражнение',
      startCurrent: 'Начать',
      catalogBanner:
        'Рекомендуем сначала пройти трек основ и продвинутые упражнения, затем переходить к дейликам. Каталог доступен для просмотра.',
      tiers: {
        beginner: 'Новичок',
        intermediate: 'Средний',
        advanced: 'Продвинутый',
      },
      bookPageLabel: 'Страница {page}',
      bookPagesLabel: 'Страницы {start}–{end}',
      bookPagesShow: 'Показать материал',
      bookPagesHide: 'Скрыть',
    },
    softRestart: {
      title: 'С возвращением!',
      bodyLines: [
        'Вас не было {days} дн.',
        'Ваш рекорд серии: {longestStreak} дней',
        'Открыто навыков: {unlockedSkills}',
        'Начать заново с более лёгкими дейликами или продолжить с текущим прогрессом.',
      ],
      easyStart: 'Новый старт (галерея сохранится)',
      continuePlaying: 'Продолжить',
    },
    errors: {
      saveFailed: 'Не удалось сохранить прогресс. После перезапуска последние изменения могут пропасть.',
      storageFull: 'Память браузера переполнена. Экспортируйте или сбросьте прогресс в настройках.',
      resetFailed: 'Не удалось удалить сохранённые данные. Закройте приложение и повторите попытку или проверьте права доступа к папке.',
      progressCorrupt:
        'Сохранённый прогресс не удалось прочитать. Создана резервная копия — экспортируйте её перед сбросом.',
      loadFailed: 'Не удалось загрузить сохранённый прогресс. Проверьте доступ к диску и повторите попытку.',
      exportCorruptBackup: 'Экспорт копии',
      showBackupFolder: 'Открыть папку',
      retryLoad: 'Повторить',
      startFreshAfterCorrupt: 'Начать заново',
      dismiss: 'Закрыть',
      boundaryTitle: 'Что-то пошло не так',
      boundaryRecover: 'Не удалось восстановить',
      boundaryReload: 'Перезагрузить',
      boundaryExhausted: 'Приложение не может восстановиться автоматически.',
      boundaryTryAgain: 'Попробовать снова',
    },
    stats: {
      title: 'Статистика',
      empty: 'Выполните квесты, чтобы увидеть тренды и разбивки практики.',
      totalSessions: 'Зафиксированных сессий',
      practiceMinutesTotal: 'Минут практики (по журналу)',
      activeDays: 'Дней с практикой',
      weeklyPractice: 'Минут в неделю (пн–вс)',
      byCategory: 'Минут по категориям',
      byDifficulty: 'Минут по сложности',
      topQuests: 'Чаще всего повторяемые квесты',
      timesCompleted: 'Раз',
      uncategorized: 'Без категории',
      speedRuns: 'Засчитано скоростных прохождений',
      weeklyInsight: 'За неделю: {quests} квестов · {minutes} мин практики',
      weeklyQuests: 'квестов',
      weeklyMinutes: 'мин практики',
      habitsTitle: 'Ваши привычки',
      dailyStreak: 'Серия дней',
      bestStreak: 'Лучшая: {days} дн.',
      chestProgress: 'Звёзды награды',
      weeklyChallengeStatus: 'Недельный вызов',
      weeklyChallengePending: 'Сначала дейлики',
      weeklyChallengeDone: 'Выполнено на неделе',
      practiceHeatmap: 'Календарь практики',
      practiceHeatmapHint: 'Ярче — дни, когда вы завершили хотя бы один квест (последние 12 недель).',
      practiceHeatmapAria: 'Активность за 12 недель, активных дней: {days}',
      streakExplainer:
        'Серия дней (выше) — когда выполнены все ежедневные квесты. Тепловая карта — любой день с хотя бы одним завершённым квестом.',
      skillRadar: 'Баланс навыков',
      skillRadarLevel: 'ср. {level}',
      adaptiveDifficulty: 'Подбор сложности дейликов',
      adaptiveFocusTags: 'Зоны фокуса',
      adaptiveEasier: 'Недавние сессии были тяжёлыми — дейлики чаще проще.',
      adaptiveHarder: 'Отличный темп — в дейликах может быть сложнее.',
      adaptiveBalanced: 'Сложность подобрана под ваш недавний ритм.',
    },
    resources: {
      title: 'Материалы',
      allCategories: 'Все категории',
      skillNode: 'Узел навыка',
      allNodes: 'Все узлы',
      tag: 'Тег',
      allTags: 'Все теги',
      search: 'Поиск',
      searchPlaceholder: 'Название или тег…',
      noResults: 'Нет роликов под эти фильтры.',
      openBrowser: 'Открыть в браузере',
      partnerChannels: 'Каналы преподавателей',
      partnerChannelsHint: 'Полный список партнёров — откройте канал, чтобы листать другие выпуски.',
      libraryStats: 'В этой сборке курируемых записей: {n} видео (дополняйте в src/renderer/data/videoResources.ts).',
      myLibrary: 'Моя библиотека',
      myLibraryHint:
        'Необязательное название заменяет заголовок с YouTube. Заголовок и канал подставляются с YouTube, если доступно; теги — из узла навыка и ключевых слов из названия.',
      addYourLink: 'Добавить видео',
      linkUrl: 'Адрес',
      linkUrlPlaceholder: 'https://…',
      linkTitleOptional: 'Название (необязательно)',
      customLinkTitlePlaceholder: 'Как назвать закладку',
      addLink: 'Добавить',
      removeLink: 'Удалить',
      invalidUrl: 'Введите корректный адрес http или https.',
      catalogVideos: 'Каталог',
      favoriteAdd: 'В избранное — будет сверху списка',
      favoriteRemove: 'Убрать из избранного',
      addVideoNodeRequired:
        'Сначала выберите узел навыка в фильтрах — к ролику будет привязан именно он.',
      nodeYoutubeSearchTitle: 'Глобальный поиск YouTube по этой ноде',
      contextTags: 'Теги темы из квеста / узла навыка',
      searchPrefix: 'Искать:',
      catalogLoading: 'Загрузка видеотеки…',
      catalogExtendedLoading: 'Загружаем расширенную библиотеку…',
      catalogLoadError: 'Не удалось загрузить каталог. Попробуйте обновить страницу.',
      catalogFiltering: 'Обновляем результаты…',
      catalogMatchCount: 'Показано {shown} из {total}',
      catalogVirtualScrollHint: 'Прокрутите список, чтобы просмотреть все совпадения.',
      loadMoreVideos: 'Ещё {n}',
      catalogCoreTitle: 'С чего начать',
      catalogMoreTitle: 'Дополнительно',
      showMoreMaterials: 'Показать ещё {n} видео',
      videoModeLong: 'Длинные',
      videoModeShort: 'Короткие',
      videoModeClipTips: 'CSP Tips',
      videoModeSketchfab: 'Sketchfab',
      videoModePinterest: 'Pinterest',
      clipTipsOpenHint: 'Открыть на Clip Studio TIPS',
      sketchfabOpenHint: 'Открыть 3D на Sketchfab',
      pinterestOpenHint: 'Открыть пины на Pinterest',
      materialSourceGroup: 'Источники материалов',
      viewLearn: 'Учусь сейчас',
      viewCatalog: 'Весь каталог',
      learnModeHint: 'Короткий набор под ваш фокус: теория, пример и референс. Полный каталог — во второй вкладке.',
      learnPrimary: 'Основной урок',
      learnShort: 'Короткий пример',
      learnReference: 'Референс',
      learnEmpty: 'Выберите узел навыка или тег в фильтрах — подберём материалы.',
      engagementViewed: 'Смотрел',
      engagementHelpful: 'Полезно',
      engagementApplied: 'Применил',
      engagementHint: 'Отмечайте ролики после просмотра — это влияет на рекомендации и достижения.',
      shortsOpenSearchLabel: 'Открыть подборку',
      youtubeShortsChannelLabel: 'Поиск Shorts на YouTube',
      catalogVideoUnit: 'роликов',
      catalogMoreAvailable: 'дополнительно',
      refWindowTitle: 'Материалы',
      refWindowSearchPlaceholder: 'Поиск по теме…',
      refWindowSearch: 'Искать',
      refWindowOpenExternal: 'Открыть снаружи',
      referenceSourceSelector: 'Источник референсов',
      referenceSourcePinterest: 'Pinterest',
      referenceSourceYoutube: 'YouTube Long',
      referenceSourceArtstation: 'ArtStation',
      referenceSourceGoogle: 'Google Images',
      refWindowTags: 'Теги',
      refWindowAll: 'Все',
      refWindowLoading: 'Загрузка…',
      refWindowEmpty: 'Нет материалов. Попробуйте другой запрос.',
      refWindowPaneLoading: 'Загрузка поиска…',
      addVideoYoutubeOnly: 'В каталог можно добавить только ссылку на видео YouTube.',
      addingVideo: 'Получаем данные о ролике…',
      addVideoPanelIntro:
        'Видео сохраняется для выбранного узла навыка и показывается в каталоге при совпадении фильтров.',
      legacyImportedLinks: 'Импортированные ссылки (выберите узел в фильтрах и добавьте снова, чтобы перенести в каталог)',
      legacyLinkBadge: 'Импорт',
    },
    sessionRitual: {
      intentTitle: 'Сессия практики',
      durationLabel: 'Длительность',
      focusLabel: 'Фокус сегодня',
      goalLabel: 'Цель этой сессии',
      goalPlaceholder: 'напр. чистые линии на разминке',
      startPractice: 'Начать практику',
      exitTitle: 'Сессия завершена',
      xpEarned: 'Заработано XP',
      practiceTime: 'Время практики',
      weakSpot: 'Следующий фокус',
      nextStep: 'Рекомендуемый шаг',
      viewGallery: 'Открыть галерею',
      done: 'Готово',
      chestTitle: 'Цикл наград завершён!',
      chestBody: 'Вы заполнили все {days} звёзд награды на этой неделе. Щит серии получен.',
      chestClaim: 'Забрать награду',
      reviewShelfTitle: 'Пора повторить',
      reviewOverdue: 'Последняя практика {days} дн. назад — время повторить',
      chapterTitle: 'Ваша глава',
      chapterFoundation: 'Основа: рисунок',
      chapterAnatomy: 'Глава: анатомия',
      chapterMotion: 'Глава: движение',
      chapterWeeks: 'Арка {weeks} нед.',
      chapterComplete: 'завершено',
      chapterContinue: 'Продолжить главу',
      growthWallTitle: 'Стена роста',
      growthWallEmpty: 'Выполняйте квесты, чтобы заполнить ленту роста.',
      monthlySummaryTitle: 'Этот месяц',
      monthlySummaryQuests: '{count} квестов выполнено',
      monthlySummaryMinutes: '{minutes} мин практики',
      monthlySummaryGrowth: 'Больше всего роста: {category}',
      monthlySummaryMistake: 'Повторяющийся фокус: {tag}',
      energyModeLabel: 'Предпочтительная длина сессии',
      energyModeHint: 'Короткие сессии — в рекомендациях чаще быстрые квесты.',
      energyShort: 'Короткая (≤15 мин)',
      energyMedium: 'Средняя (≤30 мин)',
      energyLong: 'Длинная (≤60 мин)',
      ambientPresetLabel: 'Фоновый звук',
      ambientRain: 'Дождь',
      ambientCafe: 'Кафе',
      ambientFireplace: 'Камин',
      studioThemeLabel: 'Тёмная 2',
      phaseWarmupDone: 'Разминка завершена — дальше основная фаза',
      phaseCoreStart: 'Основная фаза — главное упражнение',
      phasePolishStart: 'Фаза полировки — доведите работу',
    },
    desktop: {
      reminderTitle: 'ArtQuest',
      reminderBody: 'Время немного порисовать или попрактиковаться.',
    },
    reference: {
      title: 'Референсы',
      search: 'Поиск референсов...',
      grid: 'Сетка',
      pipette: 'Пипетка',
      ruleOfThirds: 'Правило третей',
      goldenRatio: 'Золотое сечение',
      diagonal: 'Диагонали',
      opacity: 'Прозрачность',
      pickColor: 'Нажмите на изображение, чтобы выбрать цвет',
      hex: 'Hex',
      rgb: 'RGB',
      hsl: 'HSL',
      copied: 'Скопировано!',
      noImage: 'Изображение не выбрано',
      swatches: 'Сохранённые цвета',
      clearSwatches: 'Очистить все',
      savedHint: 'Сохраняйте референсы для этого квеста — они остаются на устройстве и появятся при следующем прохождении.',
      savedEmpty: 'Пока нет сохранённых референсов. Вставьте из буфера (Ctrl+V) или выберите файл.',
      pasteHint: 'Вставьте картинку из буфера обмена в любой момент в этой панели',
      addFromFile: 'Выбрать файл',
      savedBadge: 'Сохранено референсов: {count}',
    },
    onboarding: {
      welcomeTitle: 'Добро пожаловать в ArtQuest',
      welcomeIntro:
        'Главный экран построен вокруг трёх ежедневных квестов, звёзд награды и портрета, который растёт вместе с вами. Этот тур проведёт по всем основным вкладкам — нажмите в любое место, чтобы продолжить.',
      clickToContinue: 'Нажмите в любое место, чтобы продолжить',
      skillsTitle: 'Портрет и ветки навыков',
      skillsBody:
        'Здесь живут портрет персонажа и полоски навыков. Выполнение квестов и практика наполняют XP по выбранным направлениям.',
      dailiesTitle: 'Ежедневные квесты',
      dailiesBody:
        'Три квеста каждый день — выполните все, чтобы продлить серию и заполнить звезду награды. После дейликов на главной появляются недельный вызов и рекомендованный квест.',
      navTitle: 'Главная навигация',
      navBody:
        'Главная, Квесты, Навыки, Галерея, Материалы, Прогресс и Настройки — любой раздел открывается отсюда. Во время квеста и практики здесь же видны таймеры.',
      questsTitle: 'Каталог квестов',
      questsBody:
        'Полная библиотека упражнений. Фильтры по направлению и сложности, можно добавить свой квест — без заголовков «ежедневно/неделя», только каталог.',
      galleryTitle: 'Ваша галерея',
      galleryBody:
        'Здесь сохраняются работы по завершённым квестам. Правый клик по результату — «Показать в папке» на диске.',
      skillsPageTitle: 'Дерево навыков',
      skillsPageBody:
        'Интерактивные ветки с иконками на каждом узле. Выберите узел — откроются практика, референсы и режим виджета сессии.',
      skillsNodeDemoTitle: 'Детали узла',
      skillsNodeDemoBody:
        'На панели — уровень, XP, теги и практика по таймеру. Углубляйте направление без полноценного квеста.',
      statisticsTitle: 'Прогресс и статистика',
      statisticsBody:
        'Графики и привычки: серии, звёзды награды, недельный вызов, время практики и разбивка по категориям.',
      resourcesTitle: 'Материалы и видео',
      resourcesBody:
        'Подборка роликов к узлам навыков, поиск, фильтры, избранное и свои ссылки.',
      achievementsTitle: 'Достижения',
      achievementsBody:
        'Вехи за серии, число квестов и скрытые цели — смотрите в Прогресс → Достижения по ходу игры.',
      goalsTitle: 'Ваша цель',
      goalsBody:
        'Задайте личную цель на главной — она будет напоминать каждый день. Отметьте выполненной, когда достигнете.',
      materialsEngagementBody:
        '«Сейчас в обучении» — подборка под ваш прогресс; полный каталог — все материалы. Метки запоминают, что вы открывали.',
      settingsStorageBody:
        'Выберите, где хранятся файлы галереи: только локально, локально + Google Drive или только облако. Подключите Google Drive для синхронизации.',
      settingsTitle: 'Настройки',
      settingsBody:
        'Режим хранения (локально / облако), виджет сессии, тема, язык, звуки и доступность. Полный тур можно запустить снова кнопкой ниже.',
      skipTour: 'Пропустить тур',
      stepProgress: 'Шаг {current} из {total}',
      quickWelcomeIntro:
        'Краткий обзор главного экрана — уровень, ежедневные квесты и как сдавать работу. Нажмите в любое место, чтобы продолжить.',
      quickSkillsBody:
        'Портрет и уровни навыков здесь. XP от квестов и практики заполняет полоски — чем выше уровень, тем больше вы тренировали это направление.',
      quickNextActionTitle: 'Сегодня лучше всего',
      quickNextActionBody:
        'Персональный следующий шаг — разминка, повтор или рекомендованный квест. Карточка обновляется каждый день и после сессий.',
      quickDailiesBody:
        'Три новых квеста каждый день (обновление в полночь). Нажмите «Взять квест», завершите по таймеру, загрузите работу — и получите звезду награды.',
      quickNavBody:
        'Квесты, Навыки, Галерея, Материалы и Прогресс — в этой панели, плюс таймеры активного квеста и практики.',
      portraitStarsTitle: 'Звезда награды',
      portraitStarsBody:
        'Выполните все ежедневные квесты, чтобы получить одну звезду на главной.',
      quickFullTourTitle: 'Нужен полный тур?',
      quickFullTourBody:
        'Эта кнопка запускает подробный обзор всех разделов. Его можно пройти в любой момент — а сейчас нажмите в любое место и начните первый ежедневный квест.',
    },
    levelUp: {
      title: 'Новый уровень!',
      reachedLevel: 'Достигнут уровень {level}',
    },
    dayComplete: {
      title: 'День завершён!',
      streak: 'Серия ежедневных: {days} дн.',
      bonus: '+{xp} бонус XP сегодня',
      star: 'Звезда награды {current}/{total}',
      continue: 'Продолжить',
    },
    upload: {
      dropZoneLabel: 'Загрузите работу',
      dropHint: 'Перетащите, вставьте из буфера или выберите файл',
    },
  },
  zh,
  'zh-tw': zhTw,
  ja,
  ko,
}
