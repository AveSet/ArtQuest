import type { Quest } from '@/store/models'
import {
  getFundamentalsQuestById,
  getFundamentalsTrackPhase,
  isFundamentalsQuestId,
} from '@/data/fundamentalsExercises'
import { useQuestSessionStore } from '@/store/useQuestSessionStore'

export type QuestReferenceInput = Pick<Quest, 'category' | 'tags' | 'referenceQuery'>

function activeFundamentalsPhaseIndex(questId: number): number | undefined {
  const session = useQuestSessionStore.getState().session
  if (!session || session.questId !== questId) return undefined
  const phase = session.phases[session.currentPhaseIndex]
  return phase?.kind === 'fundamentals' ? phase.phaseIndex : undefined
}

/** Resolves reference search metadata; fundamentals track quests use the active phase title/tags. */
export function resolveQuestReferenceInput(
  quest: Pick<Quest, 'id' | 'category' | 'tags' | 'referenceQuery'>,
  phaseIndex?: number,
): QuestReferenceInput {
  if (!isFundamentalsQuestId(quest.id)) {
    return {
      category: quest.category,
      tags: quest.tags,
      referenceQuery: quest.referenceQuery,
    }
  }

  const exercise = getFundamentalsQuestById(quest.id)
  if (!exercise) {
    return {
      category: quest.category,
      tags: quest.tags,
      referenceQuery: quest.referenceQuery,
    }
  }

  const activePhase = phaseIndex ?? activeFundamentalsPhaseIndex(quest.id)

  if (exercise.trackPhases && activePhase != null) {
    const trackPhase = getFundamentalsTrackPhase(exercise, activePhase)
    if (trackPhase) {
      return {
        category: quest.category,
        tags: trackPhase.topicTags,
        referenceQuery: trackPhase.referenceQuery,
      }
    }
  }

  if (exercise.referenceQuery) {
    return {
      category: quest.category,
      tags: quest.tags,
      referenceQuery: exercise.referenceQuery,
    }
  }

  return {
    category: quest.category,
    tags: quest.tags,
    referenceQuery: quest.referenceQuery,
  }
}
