import { memo } from 'react';
import { RegionSection } from '@/components/inbox/RegionSection';
import { QuestCard } from '@/components/QuestCard';
import type { QuestResponse } from '@/lib/api';
import type { GroupBy, GroupedQuests, Density } from '@/types/inboxTypes';

interface GroupedQuestListProps {
  groupBy: GroupBy;
  groupedQuests: GroupedQuests[];
  paginatedQuests: QuestResponse[];
  density: Density;
  onToggleCollapse: (regionId: string) => void;
  onTogglePin?: (regionId: string) => void;
  onComplete?: (id: string, checkboxElement?: HTMLElement) => void;
  onView?: (quest: QuestResponse) => void;
  onEdit?: (quest: QuestResponse) => void;
  onDelete?: (id: string) => void;
  onAddSubquest?: (parentQuest: QuestResponse) => void;
  isPending?: boolean;
}

const MemoizedQuestCard = memo(QuestCard);

export function GroupedQuestList({
  groupBy,
  groupedQuests,
  paginatedQuests,
  density,
  onToggleCollapse,
  onTogglePin,
  onComplete,
  onView,
  onEdit,
  onDelete,
  onAddSubquest,
  isPending = false,
}: GroupedQuestListProps) {
  if (groupBy === 'none') {
    return (
      <div className="space-y-3">
        {paginatedQuests.map((quest) => (
          <MemoizedQuestCard
            key={quest.id}
            quest={quest}
            onComplete={onComplete}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddSubquest={onAddSubquest}
            isPending={isPending}
            showInlineSubquests
            density={density}
            showRegionMarker
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groupedQuests.map((group) => (
        <RegionSection
          key={group.regionId ?? '__inbox__'}
          regionId={group.regionId}
          regionName={group.regionName}
          regionIcon={group.regionIcon}
          regionColor={group.regionColor}
          quests={group.quests}
          totalCount={group.totalCount}
          overdueCount={group.overdueCount}
          isPinned={group.isPinned}
          isCollapsed={group.isCollapsed}
          isPinnable={group.isPinnable}
          density={density}
          onToggleCollapse={onToggleCollapse}
          onTogglePin={onTogglePin}
          onComplete={onComplete}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddSubquest={onAddSubquest}
          isPending={isPending}
          showRegionMarker={groupBy === 'project'}
        />
      ))}
    </div>
  );
}
