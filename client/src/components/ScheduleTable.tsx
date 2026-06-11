import React from 'react';

interface ScheduleRow {
  id: number;
  username?: string;
  position_name: string;
  location_point: string;
  date: string;
  time_start: string;
  time_end: string;
  contact_person: string;
  contact_phone: string;
  event_name?: string;
  city?: string;
}

interface ScheduleTableProps {
  schedules: ScheduleRow[];
  showUsername?: boolean;
}

export default function ScheduleTable({ schedules, showUsername = false }: ScheduleTableProps) {
  if (schedules.length === 0) {
    return <div className="empty-state"><p>暂无排班记录</p></div>;
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            {showUsername && <th>志愿者</th>}
            {schedules[0]?.event_name && <th>赛事</th>}
            <th>岗位</th>
            <th>工作地点</th>
            <th>日期</th>
            <th>时间段</th>
            <th>对接人</th>
            <th>对接电话</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((s) => (
            <tr key={s.id}>
              {showUsername && <td>{s.username}</td>}
              {s.event_name && <td>{s.event_name}</td>}
              <td style={{ fontWeight: 500 }}>{s.position_name}</td>
              <td>{s.location_point || '-'}</td>
              <td>{s.date}</td>
              <td>
                <span style={{ color: '#1890ff', fontWeight: 500 }}>
                  {s.time_start} - {s.time_end}
                </span>
              </td>
              <td>{s.contact_person || '-'}</td>
              <td>{s.contact_phone || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
