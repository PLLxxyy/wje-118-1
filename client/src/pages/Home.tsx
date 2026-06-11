import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import EventCard from '../components/EventCard';

export default function Home() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadEvents();
  }, [filter]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await api.getEvents(filter ? { status: filter } : undefined);
      setEvents(data.events);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page">
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
          马拉松赛事志愿者管理平台
        </h1>
        <p style={{ fontSize: 16, color: '#666' }}>
          加入志愿者队伍，为马拉松赛事贡献力量
        </p>
      </div>

      <div className="flex-between mb-24">
        <h2 className="page-title" style={{ marginBottom: 0 }}>赛事列表</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { value: '', label: '全部' },
            { value: 'recruiting', label: '招募中' },
            { value: 'ongoing', label: '进行中' },
            { value: 'finished', label: '已结束' },
          ].map((item) => (
            <button
              key={item.value}
              className={`btn btn-sm ${filter === item.value ? 'btn-primary' : 'btn-default'}`}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><p>加载中...</p></div>
      ) : events.length === 0 ? (
        <div className="empty-state"><p>暂无赛事</p></div>
      ) : (
        <div>
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
