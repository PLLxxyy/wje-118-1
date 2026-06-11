import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import ScheduleTable from '../../components/ScheduleTable';

export default function ScheduleView() {
  const { eventId } = useParams();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    position_id: '',
    date: '',
    time_start: '',
    time_end: '',
    contact_person: '',
    contact_phone: '',
  });
  const [volunteers, setVolunteers] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [schedData, posData, eventData, appData] = await Promise.all([
        api.getEventSchedules(Number(eventId)),
        api.getEventPositions(Number(eventId)),
        api.getEvent(Number(eventId)),
        api.getEventApplications(Number(eventId), 'approved'),
      ]);
      setSchedules(schedData.schedules);
      setPositions(posData.positions);
      setEvent(eventData.event);
      setVolunteers(appData.applications);
      if (eventData.event) {
        setFormData((prev) => ({ ...prev, date: eventData.event.date }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSchedule({
        ...formData,
        event_id: Number(eventId),
        user_id: Number(formData.user_id),
        position_id: Number(formData.position_id),
      });
      setShowForm(false);
      setFormData({ user_id: '', position_id: '', date: event?.date || '', time_start: '', time_end: '', contact_person: '', contact_phone: '' });
      loadData();
    } catch (err: any) {
      alert(err.message || '创建排班失败');
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm('确定删除该排班？')) return;
    try {
      await api.deleteSchedule(id);
      loadData();
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  if (loading) {
    return <div className="container page"><div className="empty-state"><p>加载中...</p></div></div>;
  }

  return (
    <div className="container page">
      <div className="flex-between mb-24">
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>排班管理</h1>
          {event && <p style={{ color: '#666', fontSize: 14 }}>{event.name}</p>}
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '收起' : '+ 新增排班'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-24">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>新增排班</h3>
          <form onSubmit={handleCreateSchedule}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">志愿者</label>
                <select
                  className="form-select"
                  value={formData.user_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, user_id: e.target.value }))}
                  required
                >
                  <option value="">请选择</option>
                  {volunteers.map((v: any) => (
                    <option key={v.user_id} value={v.user_id}>
                      {v.username} - {v.position_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">岗位</label>
                <select
                  className="form-select"
                  value={formData.position_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, position_id: e.target.value }))}
                  required
                >
                  <option value="">请选择</option>
                  {positions.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">日期</label>
                <input
                  className="form-input"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">开始时间</label>
                <input
                  className="form-input"
                  type="time"
                  value={formData.time_start}
                  onChange={(e) => setFormData((prev) => ({ ...prev, time_start: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">结束时间</label>
                <input
                  className="form-input"
                  type="time"
                  value={formData.time_end}
                  onChange={(e) => setFormData((prev) => ({ ...prev, time_end: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">对接人</label>
                <input
                  className="form-input"
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contact_person: e.target.value }))}
                  placeholder="负责人姓名"
                />
              </div>
              <div className="form-group">
                <label className="form-label">对接电话</label>
                <input
                  className="form-input"
                  type="text"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contact_phone: e.target.value }))}
                  placeholder="联系电话"
                />
              </div>
            </div>

            <button className="btn btn-primary" type="submit">创建排班</button>
          </form>
        </div>
      )}

      {schedules.length === 0 ? (
        <div className="empty-state">
          <p>暂无排班</p>
          <span style={{ color: '#999', fontSize: 14 }}>点击"新增排班"开始安排志愿者</span>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>志愿者</th>
                  <th>岗位</th>
                  <th>地点</th>
                  <th>日期</th>
                  <th>时间段</th>
                  <th>对接人</th>
                  <th>对接电话</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s: any) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.username}</td>
                    <td>{s.position_name}</td>
                    <td>{s.location_point || '-'}</td>
                    <td>{s.date}</td>
                    <td>
                      <span style={{ color: '#1890ff', fontWeight: 500 }}>
                        {s.time_start} - {s.time_end}
                      </span>
                    </td>
                    <td>{s.contact_person || '-'}</td>
                    <td>{s.contact_phone || '-'}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteSchedule(s.id)}>
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
