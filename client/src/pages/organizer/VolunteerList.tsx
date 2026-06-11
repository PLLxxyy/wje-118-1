import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';

export default function VolunteerList() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [evalForm, setEvalForm] = useState<{ [key: number]: { score: string; comment: string } }>({});

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [volData, eventData] = await Promise.all([
        api.exportVolunteers(Number(eventId)),
        api.getEvent(Number(eventId)),
      ]);
      setVolunteers(volData.volunteers);
      setEvent(eventData.event);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async (userId: number) => {
    const form = evalForm[userId];
    if (!form?.score) {
      alert('请填写评分');
      return;
    }
    try {
      await api.evaluate({
        user_id: userId,
        event_id: Number(eventId),
        score: Number(form.score),
        comment: form.comment || '',
      });
      alert('评价成功');
      loadData();
    } catch (err: any) {
      alert(err.message || '评价失败');
    }
  };

  const exportCSV = () => {
    if (volunteers.length === 0) return;
    const headers = ['姓名', '邮箱', '电话', '身份证', '岗位', '地点', '日期', '上班时间', '下班时间', '签到', '签退', '评分', '评价'];
    const rows = volunteers.map((v: any) => [
      v.username, v.email, v.phone, v.id_card,
      v.position_name, v.location_point, v.schedule_date || '',
      v.time_start || '', v.time_end || '',
      v.checkin_time || '', v.checkout_time || '',
      v.score || '', v.comment || '',
    ]);
    const csvContent = '﻿' + [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `volunteers_event_${eventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="container page"><div className="empty-state"><p>加载中...</p></div></div>;
  }

  return (
    <div className="container page">
      <div className="flex-between mb-24">
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>志愿者名单</h1>
          {event && <p style={{ color: '#666', fontSize: 14 }}>{event.name}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-default" onClick={exportCSV}>
            导出CSV
          </button>
        </div>
      </div>

      {volunteers.length === 0 ? (
        <div className="empty-state">
          <p>暂无已通过审核的志愿者</p>
        </div>
      ) : (
        <div className="table-container card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>姓名</th>
                <th>电话</th>
                <th>岗位</th>
                <th>签到</th>
                <th>签退</th>
                <th>评分</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {volunteers.map((v: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 500 }}>{v.username}</td>
                  <td>{v.phone || '-'}</td>
                  <td>{v.position_name}</td>
                  <td>{v.checkin_time || '-'}</td>
                  <td>
                    {v.checkout_time ? (
                      v.checkout_time
                    ) : v.checkin_time ? (
                      <span style={{ color: '#faad14' }}>工作中</span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {v.score ? (
                      <span style={{ color: '#faad14' }}>{v.score}/5</span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <select
                        style={{ width: 70, padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: 4, fontSize: 13 }}
                        value={evalForm[v.user_id]?.score || ''}
                        onChange={(e) =>
                          setEvalForm((prev) => ({
                            ...prev,
                            [v.user_id]: { ...prev[v.user_id], score: e.target.value, comment: prev[v.user_id]?.comment || '' },
                          }))
                        }
                      >
                        <option value="">评分</option>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleEvaluate(v.user_id)}
                      >
                        评价
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
