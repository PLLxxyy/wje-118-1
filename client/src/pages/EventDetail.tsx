import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import PositionCard from '../components/PositionCard';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    try {
      const data = await api.getEvent(Number(id));
      setEvent(data.event);
      setPositions(data.positions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (position: any) => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/apply/${event.id}/${position.id}`);
  };

  if (loading) {
    return <div className="container page"><div className="empty-state"><p>加载中...</p></div></div>;
  }

  if (!event) {
    return <div className="container page"><div className="empty-state"><p>赛事不存在</p></div></div>;
  }

  const statusMap: Record<string, { label: string; className: string }> = {
    recruiting: { label: '招募中', className: 'badge-recruiting' },
    ongoing: { label: '进行中', className: 'badge-ongoing' },
    finished: { label: '已结束', className: 'badge-finished' },
  };
  const status = statusMap[event.status] || statusMap.recruiting;

  return (
    <div className="container page">
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>{event.name}</h1>
          <span className={`badge ${status.className}`} style={{ fontSize: 14, padding: '4px 16px' }}>{status.label}</span>
        </div>

        <div style={{ display: 'flex', gap: 32, marginBottom: 16, color: '#666', fontSize: 15 }}>
          <span>城市: {event.city}</span>
          <span>日期: {event.date}</span>
          <span>主办方: {event.organizer_name}</span>
        </div>

        {event.description && (
          <p style={{ color: '#555', fontSize: 15, lineHeight: 1.8 }}>{event.description}</p>
        )}
      </div>

      <div className="flex-between mb-16">
        <h2 className="page-title" style={{ marginBottom: 0 }}>招募岗位</h2>
        <span style={{ color: '#666', fontSize: 14 }}>共 {positions.length} 个岗位</span>
      </div>

      {positions.length === 0 ? (
        <div className="empty-state"><p>暂无岗位</p></div>
      ) : (
        positions.map((pos) => (
          <PositionCard
            key={pos.id}
            position={pos}
            showApply={event.status === 'recruiting' && user?.role === 'volunteer'}
            onApply={handleApply}
          />
        ))
      )}
    </div>
  );
}
