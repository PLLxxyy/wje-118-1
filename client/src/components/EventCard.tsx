import React from 'react';
import { Link } from 'react-router-dom';

interface EventCardProps {
  event: {
    id: number;
    name: string;
    city: string;
    date: string;
    description: string;
    status: string;
    organizer_name?: string;
  };
}

const statusMap: Record<string, { label: string; className: string }> = {
  recruiting: { label: '招募中', className: 'badge-recruiting' },
  ongoing: { label: '进行中', className: 'badge-ongoing' },
  finished: { label: '已结束', className: 'badge-finished' },
};

export default function EventCard({ event }: EventCardProps) {
  const status = statusMap[event.status] || statusMap.recruiting;

  return (
    <div className="card" style={{ cursor: 'pointer' }}>
      <Link to={`/events/${event.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>{event.name}</h3>
          <span className={`badge ${status.className}`}>{status.label}</span>
        </div>
        <div style={{ display: 'flex', gap: 24, marginBottom: 12, color: '#666', fontSize: 14 }}>
          <span>{event.city}</span>
          <span>{event.date}</span>
          {event.organizer_name && <span>主办方: {event.organizer_name}</span>}
        </div>
        {event.description && (
          <p style={{ color: '#888', fontSize: 14, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.description}
          </p>
        )}
      </Link>
    </div>
  );
}
