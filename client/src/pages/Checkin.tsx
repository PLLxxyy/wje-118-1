import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function Checkin() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [schedData, checkinData] = await Promise.all([
        api.getMySchedules(),
        api.getMyCheckins(),
      ]);
      setSchedules(schedData.schedules);
      setCheckins(checkinData.checkins);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isCheckedIn = (eventId: number, positionId: number) => {
    return checkins.some(
      (c: any) => c.event_id === eventId && c.position_id === positionId && c.checkout_time === ''
    );
  };

  const getCheckinRecord = (eventId: number, positionId: number) => {
    return checkins.find(
      (c: any) => c.event_id === eventId && c.position_id === positionId && c.checkout_time === ''
    );
  };

  const handleCheckin = async (eventId: number, positionId: number) => {
    setActionLoading(positionId);
    try {
      await api.checkin(eventId, positionId);
      alert('签到成功！');
      loadData();
    } catch (err: any) {
      alert(err.message || '签到失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckout = async (eventId: number, positionId: number) => {
    setActionLoading(positionId);
    try {
      await api.checkout(eventId, positionId);
      alert('签退成功！');
      loadData();
    } catch (err: any) {
      alert(err.message || '签退失败');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="container page"><div className="empty-state"><p>加载中...</p></div></div>;
  }

  return (
    <div className="container page">
      <h1 className="page-title">签到打卡</h1>

      {schedules.length === 0 ? (
        <div className="empty-state">
          <p>暂无排班</p>
          <span style={{ color: '#999', fontSize: 14 }}>您当前没有待签到的排班</span>
        </div>
      ) : (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>待签到岗位</h2>
          {schedules.map((s: any) => {
            const checkedIn = isCheckedIn(s.event_id, s.position_id);
            const record = getCheckinRecord(s.event_id, s.position_id);

            return (
              <div className="card" key={s.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                      {s.event_name} - {s.position_name}
                    </h4>
                    <p style={{ color: '#666', fontSize: 14 }}>
                      日期: {s.date} | 时间: {s.time_start} - {s.time_end} | 地点: {s.location_point}
                    </p>
                    <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
                      对接人: {s.contact_person} {s.contact_phone && `(${s.contact_phone})`}
                    </p>
                  </div>
                  <div>
                    {checkedIn ? (
                      <button
                        className="btn btn-warning"
                        onClick={() => handleCheckout(s.event_id, s.position_id)}
                        disabled={actionLoading === s.position_id}
                      >
                        {actionLoading === s.position_id ? '处理中...' : '签退'}
                      </button>
                    ) : (
                      <button
                        className="btn btn-success"
                        onClick={() => handleCheckin(s.event_id, s.position_id)}
                        disabled={actionLoading === s.position_id}
                      >
                        {actionLoading === s.position_id ? '处理中...' : '签到'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {checkins.length > 0 && (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, marginTop: 32 }}>签到记录</h2>
          <div className="table-container card" style={{ padding: 0, overflow: 'hidden' }}>
            <table>
              <thead>
                <tr>
                  <th>赛事</th>
                  <th>岗位</th>
                  <th>地点</th>
                  <th>签到时间</th>
                  <th>签退时间</th>
                </tr>
              </thead>
              <tbody>
                {checkins.map((c: any) => (
                  <tr key={c.id}>
                    <td>{c.event_name}</td>
                    <td>{c.position_name}</td>
                    <td>{c.location_point}</td>
                    <td>{c.checkin_time}</td>
                    <td>
                      {c.checkout_time ? (
                        c.checkout_time
                      ) : (
                        <span style={{ color: '#faad14' }}>工作中...</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
