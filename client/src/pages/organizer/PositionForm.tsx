import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';

export default function PositionForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('event_id');
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    event_id: eventId || '',
    name: '',
    description: '',
    people_needed: '1',
    time_start: '06:00',
    time_end: '14:00',
    location_point: '',
  });

  useEffect(() => {
    if (isEdit) {
      loadPosition();
    }
  }, [id]);

  const loadPosition = async () => {
    try {
      const data = await fetch(`/api/positions/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      }).then((r) => r.json());
      if (data.position) {
        setForm({
          event_id: String(data.position.event_id),
          name: data.position.name,
          description: data.position.description || '',
          people_needed: String(data.position.people_needed),
          time_start: data.position.time_start,
          time_end: data.position.time_end,
          location_point: data.position.location_point || '',
        });
      }
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
      const payload = {
        ...form,
        event_id: Number(form.event_id),
        people_needed: Number(form.people_needed),
      };
      if (isEdit) {
        await api.updatePosition(Number(id), payload);
        alert('岗位更新成功');
      } else {
        await api.createPosition(payload);
        alert('岗位创建成功');
      }
      navigate(`/organizer/events/${form.event_id}/positions`);
    } catch (err: any) {
      alert(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page" style={{ display: 'flex', justifyContent: 'center' }}>
      <div className="card" style={{ width: 600, maxWidth: '100%' }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 24 }}>
          {isEdit ? '编辑岗位' : '创建岗位'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">岗位名称</label>
            <input
              className="form-input"
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="例如：补给站志愿者"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">岗位说明</label>
            <textarea
              className="form-textarea"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="详细描述工作内容"
              rows={3}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">需要人数</label>
              <input
                className="form-input"
                type="number"
                min="1"
                value={form.people_needed}
                onChange={(e) => handleChange('people_needed', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">工作地点</label>
              <input
                className="form-input"
                type="text"
                value={form.location_point}
                onChange={(e) => handleChange('location_point', e.target.value)}
                placeholder="例如：5km补给站"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">开始时间</label>
              <input
                className="form-input"
                type="time"
                value={form.time_start}
                onChange={(e) => handleChange('time_start', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">结束时间</label>
              <input
                className="form-input"
                type="time"
                value={form.time_end}
                onChange={(e) => handleChange('time_end', e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ flex: 1 }}>
              {loading ? '提交中...' : (isEdit ? '保存修改' : '创建岗位')}
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
