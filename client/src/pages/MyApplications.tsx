import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待审核', className: 'badge-pending' },
  approved: { label: '已通过', className: 'badge-approved' },
  rejected: { label: '已拒绝', className: 'badge-rejected' },
};

export default function MyApplications() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();
  const { isVolunteer } = useAuth();

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await api.getMyApplications();
      setApplications(data.applications);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('确定要取消该报名吗？')) return;
    try {
      await api.cancelApplication(id);
      alert('报名已取消');
      loadApplications();
    } catch (err: any) {
      alert(err.message || '取消失败');
    }
  };

  const filteredApplications = filter
    ? applications.filter((a) => a.status === filter)
    : applications;

  return (
    <div className="container page">
      <div className="flex-between mb-24">
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          我的报名
        </h1>
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
      ) : filteredApplications.length === 0 ? (
        <div className="empty-state">
          <p>暂无报名记录</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/')}
          >
            去报名
          </button>
        </div>
      ) : (
        <div>
          {filteredApplications.map((app: any) => {
            const status = statusMap[app.status] || statusMap.pending;
            return (
              <div key={app.id} className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                      {app.event_name}
                    </h3>
                    <p style={{ color: '#666', fontSize: 14 }}>
                      岗位：{app.position_name}
                    </p>
                  </div>
                  <span className={`badge ${status.className}`}>{status.label}</span>
                </div>

                {app.location_point && (
                  <p style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>
                  工作地点：{app.location_point}
                </p>
                )}

                {app.available_times && (
                  <p style={{ color: '#888', fontSize: 13, marginBottom: 12 }}>
                    可服务时间：{app.available_times}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                  <span style={{ color: '#999', fontSize: 12 }}>
                    报名时间：{app.created_at}
                  </span>
                  <div>
                    {app.status === 'pending' && isVolunteer && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCancel(app.id)}
                      >
                        取消报名
                      </button>
                    )}
                    {app.status === 'approved' && (
                      <button
                        className="btn btn-default btn-sm"
                        onClick={() => navigate('/my-schedule')}
                      >
                        查看排班
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
