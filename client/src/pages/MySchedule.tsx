import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import ScheduleTable from '../components/ScheduleTable';

export default function MySchedule() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const data = await api.getMySchedules();
      setSchedules(data.schedules);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page">
      <h1 className="page-title">我的排班表</h1>

      {loading ? (
        <div className="empty-state"><p>加载中...</p></div>
      ) : schedules.length === 0 ? (
        <div className="empty-state">
          <p>暂无排班</p>
          <span style={{ color: '#999', fontSize: 14 }}>报名审核通过后，赛事方将为您安排排班</span>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 24 }}>
            <ScheduleTable schedules={schedules} />
          </div>

          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>排班统计</h3>
            <div className="grid-3">
              <div className="stat-card">
                <div className="stat-value">{schedules.length}</div>
                <div className="stat-label">排班总数</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: '#52c41a' }}>
                  {new Set(schedules.map((s: any) => s.event_id)).size}
                </div>
                <div className="stat-label">参与赛事</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: '#faad14' }}>
                  {new Set(schedules.map((s: any) => s.position_name)).size}
                </div>
                <div className="stat-label">岗位数量</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
