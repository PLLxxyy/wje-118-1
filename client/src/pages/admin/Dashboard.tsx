import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container page"><div className="empty-state"><p>加载中...</p></div></div>;
  }

  if (!stats) {
    return <div className="container page"><div className="empty-state"><p>加载失败</p></div></div>;
  }

  return (
    <div className="container page">
      <h1 className="page-title">后台管理</h1>

      <div className="grid-3 mb-24">
        <div className="stat-card">
          <div className="stat-value">{stats.totalUsers}</div>
          <div className="stat-label">总用户数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#52c41a' }}>{stats.totalVolunteers}</div>
          <div className="stat-label">志愿者</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#faad14' }}>{stats.totalOrganizers}</div>
          <div className="stat-label">赛事方</div>
        </div>
      </div>

      <div className="grid-4 mb-24">
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#1890ff' }}>{stats.totalEvents}</div>
          <div className="stat-label">总赛事</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#52c41a' }}>{stats.recruitingEvents}</div>
          <div className="stat-label">招募中</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#666' }}>{stats.finishedEvents}</div>
          <div className="stat-label">已结束</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#722ed1' }}>{stats.totalCheckins}</div>
          <div className="stat-label">签到次数</div>
        </div>
      </div>

      <div className="grid-2 mb-24">
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#eb2f96' }}>{stats.totalApplications}</div>
          <div className="stat-label">总报名数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#faad14' }}>{stats.pendingApplications}</div>
          <div className="stat-label">待审核</div>
        </div>
      </div>

      <div className="flex-between mb-16">
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>赛事招募进度</h2>
        <Link to="/admin/stats" className="btn btn-default btn-sm">查看详细统计</Link>
      </div>

      {stats.eventProgress && stats.eventProgress.length > 0 && (
        <div className="table-container card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>赛事</th>
                <th>城市</th>
                <th>日期</th>
                <th>状态</th>
                <th>岗位数</th>
                <th>需要人数</th>
                <th>已分配</th>
                <th>报名数</th>
                <th>待审核</th>
                <th>完成率</th>
              </tr>
            </thead>
            <tbody>
              {stats.eventProgress.map((ep: any) => {
                const progress = ep.total_needed > 0
                  ? Math.round((ep.total_assigned / ep.total_needed) * 100)
                  : 0;
                return (
                  <tr key={ep.id}>
                    <td>
                      <Link to={`/events/${ep.id}`} style={{ fontWeight: 500 }}>{ep.name}</Link>
                    </td>
                    <td>{ep.city}</td>
                    <td>{ep.date}</td>
                    <td>
                      <span className={`badge badge-${ep.status}`}>
                        {ep.status === 'recruiting' ? '招募中' : ep.status === 'ongoing' ? '进行中' : '已结束'}
                      </span>
                    </td>
                    <td>{ep.total_positions || 0}</td>
                    <td>{ep.total_needed || 0}</td>
                    <td>{ep.total_assigned || 0}</td>
                    <td>{ep.total_applications || 0}</td>
                    <td>{ep.pending_count || 0}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 60, height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            width: `${progress}%`,
                            height: '100%',
                            background: progress >= 100 ? '#52c41a' : '#1890ff',
                            borderRadius: 3,
                          }} />
                        </div>
                        <span style={{ fontSize: 13 }}>{progress}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
