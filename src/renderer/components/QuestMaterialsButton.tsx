import { useNavigate } from 'react-router'
import { useI18n } from '@/i18n'
import type { Quest } from '@/store/models'
import { questResourcesPath } from '@/utils/questResourcesUrl'

type Props = {
  quest: Pick<Quest, 'category' | 'tags'>
  className?: string
  variant?: 'primary' | 'secondary'
}

export default function QuestMaterialsButton({ quest, className = '', variant = 'secondary' }: Props) {
  const navigate = useNavigate()
  const { t } = useI18n()
  const btnClass = variant === 'primary' ? 'btn-primary' : 'btn-secondary'

  return (
    <button
      type="button"
      className={`${btnClass} ${className}`.trim()}
      onClick={() => navigate(questResourcesPath(quest))}
    >
      📚 {t.quests.materials}
    </button>
  )
}
