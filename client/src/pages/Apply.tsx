import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function Apply() {
  const { eventId, positionId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [position, setPosition] = useState<any>(null);
  const [availableTimes, setAvailableTimes] = useState('');
  const [personalInfo, setPersonalInfo] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [eventId, positionId]);

  const loadData = async () => {
    try {
      const [eventData, posData] = await Promise.all([
        api.getEvent(Number(eventId)),
        api.getEventPositions(Number(eventId)),
      ]);
      setEvent(eventData.event);
      const pos = (posData.positions as any[]).find((p: any) => p.id === Number(positionId));
      setPosition(pos);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await api.apply({
        event_id: Number(eventId),
        position_id: Number(positionId),
        available_times: availableTimes,
        personal_info: personalInfo,
      });
      alert('报名成功，请等待审核！');
      navigate(`/events/${eventId}`);
    } catch (err: any) {
      setError(err.message || '报名失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="container page"><div className="empty-state"><p>加载中...</p></div></div>;
  }

  if (!event || !position) {
    return <div className="container page"><div className="empty-state"><p>数据不存在</p></div></div>;
  }

  return (
    <div className="container page" style={{ display: 'flex', justifyContent: 'center' }}>
      <div className="card" style={{ width: 600, maxWidth: '100%' }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 24 }}>报名志愿者岗位</h2>

        <div style={{ background: '#f6f9ff', padding: 16, borderRadius: 8, marginBottom: 24 }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>{event.name}</p>
          <p style={{ color: '#666', fontSize: 14 }}>岗位: {position.name}</p>
          <p style={{ color: '#666', fontSize: 14 }}>工作时间: {position.time_start} - {position.time_end}</p>
          <p style={{ color: '#666', fontSize: 14 }}>工作地点: {position.location_point}</p>
          {position.description && (
            <p style={{ color: '#666', fontSize: 14, marginTop: 8 }}>{position.description}</p>
          )}
        </div>

        {error && (
          <div style={{ background: '#fff2f0', border: '1px solid #ffccc7', padding: '10px 16px', borderRadius: 6, marginBottom: 16, color: '#ff4d4f', fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">可服务时间段</label>
            <textarea
              className="form-textarea"
              value={availableTimes}
              onChange={(e) => setAvailableTimes(e.target.value)}
              placeholder="请填写您可以服务的时间段，例如：全天可用 / 仅上午 / 仅下午等"
              rows={3}
            />
            <span className="form-hint">请说明您在比赛日可服务的时间段</span>
          </div>

          <div className="form-group">
            <label className="form-label">个人信息补充</label>
            <textarea
              className="form-textarea"
              value={personalInfo}
              onChange={(e) => setPersonalInfo(e.target.value)}
              placeholder="请补充您的相关经验、技能或其他信息（选填）"
              rows={3}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button
              className="btn btn-primary btn-lg"
              type="submit"
              disabled={submitting}
              style={{ flex: 1 }}
            >
              {submitting ? '提交中...' : '提交报名'}
            </button>
            <button
              className="btn btn-default btn-lg"
              type="button"
              onClick={() => navigate(-1)}
            >
              返回
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
