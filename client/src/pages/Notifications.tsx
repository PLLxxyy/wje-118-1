import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import NotificationItem from '../components/NotificationItem';

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRead = async (id: number) => {
    try {
      await api.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleReadAll = async () => {
    try {
      await api.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="container page">
      <div className="flex-between mb-24">
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          通知
          {unreadCount > 0 && (
            <span style={{
              marginLeft: 12,
              padding: '2px 10px',
              background: '#ff4d4f',
              color: '#fff',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 500,
            }}>
              {unreadCount} 条未读
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <button className="btn btn-default btn-sm" onClick={handleReadAll}>
            全部已读
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="empty-state"><p>加载中...</p></div>
        ) : notifications.length === 0 ? (
          <div className="empty-state"><p>暂无通知</p></div>
        ) : (
          notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onRead={handleRead} />
          ))
        )}
      </div>
    </div>
  );
}
