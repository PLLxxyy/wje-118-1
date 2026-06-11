import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';

export default function Applications() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [eventId, filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appData, eventData] = await Promise.all([
        api.getEventApplications(Number(eventId), filter || undefined),
        api.getEvent(Number(eventId)),
      ]);
      setApplications(appData.applications);
      setEvent(eventData.event);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm('确定通过该报名？')) return;
    try {
      await api.updateApplicationStatus(id, 'approved');
      loadData();
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('确定拒绝该报名？')) return;
    try {
      await api.updateApplicationStatus(id, 'rejected');
      loadData();
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  };

  return (
    <div className="container page">
      <div className="flex-between mb-24">
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>
            报名审核
          </h1>
          {event && <p style={{ color: '#666', fontSize: 14 }}>{event.name}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { value: '', label: '全部' },
            { value: 'pending', label: '待审核' },
            { value: 'approved', label: '已通过' },
            { value: 'rejected', label: '已拒绝' },
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
      ) : applications.length === 0 ? (
        <div className="empty-state"><p>暂无报名记录</p></div>
      ) : (
        <div className="table-container card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>志愿者</th>
                <th>手机号</th>
                <th>身份证</th>
                <th>报名岗位</th>
                <th>地点</th>
                <th>可服务时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a: any) => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 500 }}>{a.username}</td>
                  <td>{a.phone || '-'}</td>
                  <td>{a.id_card || '-'}</td>
                  <td>{a.position_name}</td>
                  <td>{a.location_point || '-'}</td>
                  <td>{a.available_times || '-'}</td>
                  <td>
                    <span className={`badge badge-${a.status}`}>
                      {a.status === 'pending' ? '待审核' : a.status === 'approved' ? '已通过' : '已拒绝'}
                    </span>
                  </td>
                  <td>
                    {a.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-success btn-sm" onClick={() => handleApprove(a.id)}>
                          通过
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleReject(a.id)}>
                          拒绝
                        </button>
                      </div>
                    )}
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
