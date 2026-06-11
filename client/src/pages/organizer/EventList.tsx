import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';

export default function EventList() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await api.getMyEvents();
      setEvents(data.events);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该赛事？此操作不可恢复。')) return;
    try {
      await api.deleteEvent(id);
      loadEvents();
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  const statusMap: Record<string, { label: string; className: string }> = {
    recruiting: { label: '招募中', className: 'badge-recruiting' },
    ongoing: { label: '进行中', className: 'badge-ongoing' },
    finished: { label: '已结束', className: 'badge-finished' },
  };

  return (
    <div className="container page">
      <div className="flex-between mb-24">
        <h1 className="page-title" style={{ marginBottom: 0 }}>我的赛事</h1>
        <Link to="/organizer/events/new" className="btn btn-primary">
          + 创建赛事
        </Link>
      </div>

      {loading ? (
        <div className="empty-state"><p>加载中...</p></div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <p>暂无赛事</p>
          <Link to="/organizer/events/new" className="btn btn-primary" style={{ marginTop: 12 }}>
            创建第一个赛事
          </Link>
        </div>
      ) : (
        events.map((event: any) => {
          const status = statusMap[event.status] || statusMap.recruiting;
          return (
            <div className="card" key={event.id}>
              <div className="flex-between mb-8">
                <h3 style={{ fontSize: 18, fontWeight: 600 }}>{event.name}</h3>
                <span className={`badge ${status.className}`}>{status.label}</span>
              </div>
              <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>
                {event.city} | {event.date}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Link to={`/organizer/events/${event.id}/positions`} className="btn btn-default btn-sm">
                  岗位管理
                </Link>
                <Link to={`/organizer/events/${event.id}/applications`} className="btn btn-default btn-sm">
                  报名审核
                </Link>
                <Link to={`/organizer/events/${event.id}/schedule`} className="btn btn-default btn-sm">
                  排班管理
                </Link>
                <Link to={`/organizer/events/${event.id}/volunteers`} className="btn btn-default btn-sm">
                  志愿者名单
                </Link>
                <Link to={`/organizer/events/${event.id}/edit`} className="btn btn-default btn-sm">
                  编辑
                </Link>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(event.id)}>
                  删除
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
