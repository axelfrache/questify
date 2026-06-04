import { Bell, CheckCheck, Trash2, Zap, Flame, AlertTriangle, Trophy, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, parseISO } from 'date-fns';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '@/hooks/use-api';
import type { NotificationResponse, NotificationType } from '@/lib/api';

type NotificationConfig = {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

const NOTIFICATION_CONFIG: Record<NotificationType, NotificationConfig> = {
  QUEST_DUE_SOON: { icon: Clock, color: 'text-amber-500' },
  QUEST_OVERDUE: { icon: AlertTriangle, color: 'text-red-500' },
  QUEST_COMPLETED: { icon: Trophy, color: 'text-primary' },
  LEVEL_UP: { icon: Zap, color: 'text-violet-500' },
  STREAK_AT_RISK: { icon: Flame, color: 'text-orange-500' },
};

function NotificationItem({
  notification,
  onRead,
  onDelete,
}: {
  notification: NotificationResponse;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const config = NOTIFICATION_CONFIG[notification.type];
  const Icon = config.icon;
  const timeAgo = formatDistanceToNow(parseISO(notification.createdAt), { addSuffix: true });

  return (
    <div
      className={cn(
        'group relative flex gap-3 px-4 py-3 cursor-default transition-colors hover:bg-muted/50',
        !notification.read && 'bg-primary/[0.04]'
      )}
      onClick={() => {
        if (!notification.read) onRead(notification.id);
      }}
    >
      {!notification.read && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary" />
      )}

      <div className={cn('mt-0.5 shrink-0', config.color)}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm leading-snug',
            notification.read ? 'text-muted-foreground' : 'font-medium text-foreground'
          )}
        >
          {notification.title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{notification.body}</p>
        <p className="mt-1 text-[11px] text-muted-foreground/60">{timeAgo}</p>
      </div>

      <button
        className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded p-1 text-muted-foreground hover:text-foreground"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
        aria-label="Delete notification"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function NotificationInbox() {
  const { t } = useTranslation();
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[10px] font-semibold tabular-nums text-primary-foreground leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-80 p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">{t('notifications.title')}</h3>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {t('notifications.mark_all_read')}
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center py-10 px-4 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">{t('notifications.empty')}</p>
            <p className="mt-0.5 text-xs text-muted-foreground/60">{t('notifications.up_to_date')}</p>
          </div>
        ) : (
          <div className="divide-y divide-border overflow-y-auto max-h-[420px]">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={(id) => markRead.mutate(id)}
                onDelete={(id) => deleteNotification.mutate(id)}
              />
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
