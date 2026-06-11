import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function Stats() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userFilter, setUserFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData] = await Promise.all([
        api.getStats(),
        api.getUsers(userFilter || undefined),
      ]);
      setStats(statsData);
      setUsers(usersData.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container page"><div className="empty-state"><p>加载中...</p></div></div>;
  }

  return (
    <div className="container page">
      <h1 className="page-title">平台统计</h1>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>用户管理</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { value: '', label: '全部' },
          { value: 'volunteer', label: '志愿者' },
          { value: 'organizer', label: '赛事方' },
          { value: 'admin', label: '管理员' },
        ].map((item) => (
          <button
            key={item.value}
            className={`btn btn-sm ${userFilter === item.value ? 'btn-primary' : 'btn-default'}`}
            onClick={() => setUserFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="table-container card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>用户名</th>
              <th>邮箱</th>
              <th>角色</th>
              <th>手机号</th>
              <th>注册时间</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td style={{ fontWeight: 500 }}>{u.username}</td>
                <td>{u.email}</td>
                <td>
                  <span style={{
                    padding: '2px 10px',
                    borderRadius: 12,
                    fontSize: 12,
                    background: u.role === 'admin' ? '#fff2f0' : u.role === 'organizer' ? '#fff7e6' : '#f6ffed',
                    color: u.role === 'admin' ? '#ff4d4f' : u.role === 'organizer' ? '#faad14' : '#52c41a',
                  }}>
                    {u.role === 'admin' ? '管理员' : u.role === 'organizer' ? '赛事方' : '志愿者'}
                  </span>
                </td>
                <td>{u.phone || '-'}</td>
                <td>{u.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {stats?.eventProgress && stats.eventProgress.length > 0 && (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, marginTop: 32 }}>各赛事招募进度</h2>
          {stats.eventProgress.map((ep: any) => {
            const progress = ep.total_needed > 0
              ? Math.round((ep.total_assigned / ep.total_needed) * 100)
              : 0;

            return (
              <div className="card mb-16" key={ep.id}>
                <div className="flex-between mb-8">
                  <h3 style={{ fontSize: 16, fontWeight: 600 }}>{ep.name}</h3>
                  <span className={`badge badge-${ep.status}`}>
                    {ep.status === 'recruiting' ? '招募中' : ep.status === 'ongoing' ? '进行中' : '已结束'}
                  </span>
                </div>
                <p style={{ color: '#666', fontSize: 14, marginBottom: 12 }}>
                  {ep.city} | {ep.date}
                </p>

                <div className="grid-4 mb-8">
                  <div>
                    <span style={{ color: '#999', fontSize: 13 }}>岗位数</span>
                    <p style={{ fontSize: 20, fontWeight: 600 }}>{ep.total_positions || 0}</p>
                  </div>
                  <div>
                    <span style={{ color: '#999', fontSize: 13 }}>需要人数</span>
                    <p style={{ fontSize: 20, fontWeight: 600 }}>{ep.total_needed || 0}</p>
                  </div>
                  <div>
                    <span style={{ color: '#999', fontSize: 13 }}>已分配</span>
                    <p style={{ fontSize: 20, fontWeight: 600, color: '#52c41a' }}>{ep.total_assigned || 0}</p>
                  </div>
                  <div>
                    <span style={{ color: '#999', fontSize: 13 }}>报名数</span>
                    <p style={{ fontSize: 20, fontWeight: 600, color: '#1890ff' }}>{ep.total_applications || 0}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: progress >= 100 ? '#52c41a' : '#1890ff',
                      borderRadius: 4,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                  <span style={{ fontWeight: 600, color: progress >= 100 ? '#52c41a' : '#1890ff' }}>
                    {progress}%
                  </span>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
