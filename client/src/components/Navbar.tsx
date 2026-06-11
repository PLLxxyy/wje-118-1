import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      background: '#fff',
      borderBottom: '1px solid #f0f0f0',
      padding: '0 24px',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <Link to="/" style={{ fontSize: 18, fontWeight: 700, color: '#1890ff' }}>
          MarathonVol
        </Link>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link to="/" style={{ color: '#555', fontSize: 14 }}>赛事列表</Link>
          {user && (
            <>
              <Link to="/my-schedule" style={{ color: '#555', fontSize: 14 }}>我的排班</Link>
              <Link to="/checkin" style={{ color: '#555', fontSize: 14 }}>签到打卡</Link>
              <Link to="/notifications" style={{ color: '#555', fontSize: 14 }}>通知</Link>
            </>
          )}
          {user && (user.role === 'organizer' || user.role === 'admin') && (
            <>
              <Link to="/organizer/events" style={{ color: '#555', fontSize: 14 }}>赛事管理</Link>
            </>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin/dashboard" style={{ color: '#555', fontSize: 14 }}>后台管理</Link>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {user ? (
          <>
            <span style={{ color: '#666', fontSize: 14 }}>
              {user.username}
              <span style={{
                marginLeft: 8,
                padding: '2px 8px',
                background: user.role === 'admin' ? '#ff4d4f' : user.role === 'organizer' ? '#faad14' : '#52c41a',
                color: '#fff',
                borderRadius: 10,
                fontSize: 11,
              }}>
                {user.role === 'admin' ? '管理员' : user.role === 'organizer' ? '赛事方' : '志愿者'}
              </span>
            </span>
            <button onClick={handleLogout} className="btn btn-default btn-sm">
              退出
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-default btn-sm">登录</Link>
            <Link to="/signup" className="btn btn-primary btn-sm">注册</Link>
          </>
        )}
      </div>
    </nav>
  );
}
