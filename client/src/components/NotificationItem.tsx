import React from 'react';

interface Notification {
  id: number;
  type: string;
  title: string;
  content: string;
  is_read: number;
  created_at: string;
}

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: number) => void;
}

const typeIcons: Record<string, string> = {
  application_approved: '✅',
  application_rejected: '❌',
  schedule_created: '📅',
  schedule_updated: '🔄',
  schedule_cancelled: '🚫',
  evaluation: '⭐',
};

export default function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const icon = typeIcons[notification.type] || '📢';

  return (
    <div
      style={{
        padding: '16px',
        borderBottom: '1px solid #f0f0f0',
        background: notification.is_read ? '#fff' : '#f6f9ff',
        cursor: 'pointer',
        transition: 'background 0.2s',
      }}
      onClick={() => !notification.is_read && onRead(notification.id)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span style={{ fontWeight: notification.is_read ? 400 : 600, fontSize: 15 }}>
            {notification.title}
          </span>
          {!notification.is_read && (
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#1890ff',
              display: 'inline-block',
            }} />
          )}
        </div>
        <span style={{ color: '#999', fontSize: 12, whiteSpace: 'nowrap', marginLeft: 16 }}>
          {notification.created_at}
        </span>
      </div>
      <p style={{ color: '#666', fontSize: 14, paddingLeft: 26, lineHeight: 1.5 }}>
        {notification.content}
      </p>
    </div>
  );
}
