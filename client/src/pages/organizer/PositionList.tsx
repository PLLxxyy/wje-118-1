import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';

export default function PositionList() {
  const { eventId } = useParams();
  const [positions, setPositions] = useState<any[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [posData, eventData] = await Promise.all([
        api.getEventPositions(Number(eventId)),
        api.getEvent(Number(eventId)),
      ]);
      setPositions(posData.positions);
      setEvent(eventData.event);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该岗位？')) return;
    try {
      await api.deletePosition(id);
      loadData();
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  if (loading) {
    return <div className="container page"><div className="empty-state"><p>加载中...</p></div></div>;
  }

  return (
    <div className="container page">
      <div className="flex-between mb-24">
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>岗位管理</h1>
          {event && <p style={{ color: '#666', fontSize: 14 }}>{event.name}</p>}
        </div>
        <Link to={`/organizer/events/${eventId}/positions/new`} className="btn btn-primary">
          + 添加岗位
        </Link>
      </div>

      {positions.length === 0 ? (
        <div className="empty-state">
          <p>暂无岗位</p>
          <Link to={`/organizer/events/${eventId}/positions/new`} className="btn btn-primary" style={{ marginTop: 12 }}>
            添加第一个岗位
          </Link>
        </div>
      ) : (
        positions.map((pos: any) => {
          const progress = pos.people_needed > 0
            ? Math.round((pos.people_assigned / pos.people_needed) * 100)
            : 0;

          return (
            <div className="card" key={pos.id}>
              <div className="flex-between mb-8">
                <h4 style={{ fontSize: 16, fontWeight: 600 }}>{pos.name}</h4>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Link to={`/organizer/positions/${pos.id}/edit`} className="btn btn-default btn-sm">
                    编辑
                  </Link>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(pos.id)}>
                    删除
                  </button>
                </div>
              </div>
              {pos.description && (
                <p style={{ color: '#666', fontSize: 14, marginBottom: 8 }}>{pos.description}</p>
              )}
              <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#888', marginBottom: 12 }}>
                <span>时间: {pos.time_start} - {pos.time_end}</span>
                <span>地点: {pos.location_point || '-'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: progress >= 100 ? '#52c41a' : '#1890ff',
                    borderRadius: 3,
                  }} />
                </div>
                <span style={{ fontSize: 13, color: '#666' }}>
                  {pos.people_assigned}/{pos.people_needed} 人 ({progress}%)
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
