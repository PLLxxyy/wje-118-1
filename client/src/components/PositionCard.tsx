import React from 'react';

interface Position {
  id: number;
  event_id: number;
  name: string;
  description: string;
  people_needed: number;
  people_assigned: number;
  time_start: string;
  time_end: string;
  location_point: string;
}

interface PositionCardProps {
  position: Position;
  onApply?: (position: Position) => void;
  showApply?: boolean;
}

export default function PositionCard({ position, onApply, showApply = false }: PositionCardProps) {
  const remaining = position.people_needed - position.people_assigned;
  const progress = position.people_needed > 0
    ? Math.round((position.people_assigned / position.people_needed) * 100)
    : 0;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <h4 style={{ fontSize: 16, fontWeight: 600 }}>{position.name}</h4>
        {showApply && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onApply?.(position)}
            disabled={remaining <= 0}
          >
            {remaining > 0 ? '立即报名' : '已满员'}
          </button>
        )}
      </div>

      {position.description && (
        <p style={{ color: '#666', fontSize: 14, marginBottom: 12, lineHeight: 1.6 }}>
          {position.description}
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: '#888', marginBottom: 12 }}>
        <span>工作时间: {position.time_start} - {position.time_end}</span>
        {position.location_point && <span>工作地点: {position.location_point}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: progress >= 100 ? '#52c41a' : '#1890ff',
            borderRadius: 3,
            transition: 'width 0.3s',
          }} />
        </div>
        <span style={{ fontSize: 13, color: '#666', whiteSpace: 'nowrap' }}>
          {position.people_assigned}/{position.people_needed} 人
          {remaining > 0 && <span style={{ color: '#1890ff', marginLeft: 8 }}>还差 {remaining} 人</span>}
        </span>
      </div>
    </div>
  );
}
