import { memo, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { QuestCard } from '@/components/QuestCard';
import type { QuestResponse } from '@/lib/api';
import type { Density } from '@/types/inboxTypes';

interface VirtualizedQuestListProps {
  quests: QuestResponse[];
  density: Density;
  onComplete?: (id: string, checkboxElement?: HTMLElement) => void;
  onEdit?: (quest: QuestResponse) => void;
  onDelete?: (id: string) => void;
  onAddSubquest?: (parentQuest: QuestResponse) => void;
  isPending?: boolean;
  showInlineSubquests?: boolean;
}

const MemoizedQuestCard = memo(QuestCard);

export function VirtualizedQuestList({
  quests,
  density,
  onComplete,
  onEdit,
  onDelete,
  onAddSubquest,
  isPending = false,
  showInlineSubquests = true,
}: VirtualizedQuestListProps) {
  const itemContent = useCallback(
    (index: number) => {
      const quest = quests[index];
      return (
        <div className="pb-3">
          <MemoizedQuestCard
            quest={quest}
            onComplete={onComplete}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddSubquest={onAddSubquest}
            isPending={isPending}
            showInlineSubquests={showInlineSubquests}
            density={density}
          />
        </div>
      );
    },
    [quests, density, onComplete, onEdit, onDelete, onAddSubquest, isPending, showInlineSubquests]
  );

  if (quests.length === 0) {
    return null;
  }

  return (
    <Virtuoso
      style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}
      totalCount={quests.length}
      itemContent={itemContent}
      overscan={5}
      className="scrollbar-thin"
    />
  );
}
