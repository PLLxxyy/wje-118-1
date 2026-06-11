import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="card" style={{ width: 420, maxWidth: '100%' }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, textAlign: 'center', marginBottom: 8 }}>登录</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: 24 }}>
          登录马拉松赛事志愿者管理平台
        </p>

        {error && (
          <div style={{ background: '#fff2f0', border: '1px solid #ffccc7', padding: '10px 16px', borderRadius: 6, marginBottom: 16, color: '#ff4d4f', fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              className="form-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>

          <button
            className="btn btn-primary btn-lg"
            type="submit"
            disabled={loading}
            style={{ width: '100%', marginTop: 8 }}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#666' }}>
          还没有账号？ <Link to="/signup">立即注册</Link>
        </p>

        <div style={{ marginTop: 20, padding: '12px 16px', background: '#f6f9ff', borderRadius: 6, fontSize: 13, color: '#666' }}>
          <p style={{ fontWeight: 500, marginBottom: 4 }}>测试账号：</p>
          <p>管理员: admin / admin123</p>
          <p>赛事方: organizer1 / org123</p>
          <p>志愿者: volunteer1 / vol123</p>
        </div>
      </div>
    </div>
  );
}
