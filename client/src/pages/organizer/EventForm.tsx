import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';

export default function EventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    city: '',
    date: '',
    description: '',
    status: 'recruiting',
  });

  useEffect(() => {
    if (isEdit) {
      loadEvent();
    }
  }, [id]);

  const loadEvent = async () => {
    try {
      const data = await api.getEvent(Number(id));
      setForm({
        name: data.event.name,
        city: data.event.city,
        date: data.event.date,
        description: data.event.description || '',
        status: data.event.status,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.updateEvent(Number(id), form);
        alert('赛事更新成功');
      } else {
        await api.createEvent(form);
        alert('赛事创建成功');
      }
      navigate('/organizer/events');
    } catch (err: any) {
      alert(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page" style={{ display: 'flex', justifyContent: 'center' }}>
      <div className="card" style={{ width: 640, maxWidth: '100%' }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 24 }}>
          {isEdit ? '编辑赛事' : '创建赛事'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">赛事名称</label>
            <input
              className="form-input"
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="例如：2026北京国际马拉松"
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">城市</label>
              <input
                className="form-input"
                type="text"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="赛事举办城市"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">比赛日期</label>
              <input
                className="form-input"
                type="date"
                value={form.date}
                onChange={(e) => handleChange('date', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">赛事介绍</label>
            <textarea
              className="form-textarea"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="请输入赛事介绍"
              rows={4}
            />
          </div>

          {isEdit && (
            <div className="form-group">
              <label className="form-label">赛事状态</label>
              <select
                className="form-select"
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <option value="recruiting">招募中</option>
                <option value="ongoing">进行中</option>
                <option value="finished">已结束</option>
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ flex: 1 }}>
              {loading ? '提交中...' : (isEdit ? '保存修改' : '创建赛事')}
            </button>
            <button className="btn btn-default btn-lg" type="button" onClick={() => navigate(-1)}>
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
