import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'volunteer',
    phone: '',
    id_card: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }

    if (form.password.length < 6) {
      setError('密码长度至少6位');
      return;
    }

    setLoading(true);
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role,
        phone: form.phone,
        id_card: form.id_card,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="card" style={{ width: 480, maxWidth: '100%' }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, textAlign: 'center', marginBottom: 8 }}>注册</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: 24 }}>
          创建您的账号
        </p>

        {error && (
          <div style={{ background: '#fff2f0', border: '1px solid #ffccc7', padding: '10px 16px', borderRadius: 6, marginBottom: 16, color: '#ff4d4f', fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">角色</label>
            <select
              className="form-select"
              value={form.role}
              onChange={(e) => handleChange('role', e.target.value)}
            >
              <option value="volunteer">志愿者</option>
              <option value="organizer">赛事方</option>
            </select>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">用户名</label>
              <input
                className="form-input"
                type="text"
                value={form.username}
                onChange={(e) => handleChange('username', e.target.value)}
                placeholder="请输入用户名"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">邮箱</label>
              <input
                className="form-input"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="请输入邮箱"
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">密码</label>
              <input
                className="form-input"
                type="password"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="至少6位"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">确认密码</label>
              <input
                className="form-input"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                placeholder="再次输入密码"
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">手机号</label>
              <input
                className="form-input"
                type="text"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="请输入手机号"
              />
            </div>
            <div className="form-group">
              <label className="form-label">身份证号</label>
              <input
                className="form-input"
                type="text"
                value={form.id_card}
                onChange={(e) => handleChange('id_card', e.target.value)}
                placeholder="请输入身份证号"
              />
            </div>
          </div>

          <button
            className="btn btn-primary btn-lg"
            type="submit"
            disabled={loading}
            style={{ width: '100%', marginTop: 8 }}
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#666' }}>
          已有账号？ <Link to="/login">去登录</Link>
        </p>
      </div>
    </div>
  );
}
