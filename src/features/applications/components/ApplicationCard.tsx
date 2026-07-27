import React from 'react';
import type { Application } from '../types/application';
import { MapPin, DollarSign, Clock } from 'lucide-react';

interface Props {
  application: Application;
  onClick: () => void;
  isDragging?: boolean;
}

export const ApplicationCard: React.FC<Props> = ({ application, onClick, isDragging }) => {
  return (
    <div 
      onClick={onClick}
      style={{
        backgroundColor: 'var(--bg-primary)',
        padding: '16px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        boxShadow: isDragging ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        cursor: isDragging ? 'grabbing' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        transition: 'all 0.2s ease',
        transform: isDragging ? 'rotate(2deg)' : 'none',
      }}
    >
      <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
        {application.jobTitle || '未命名岗位'}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        {application.companyName || '未知公司'}
      </div>
      
      {(application.location || application.salary) && (
        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
          {application.location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={12} /> {application.location}
            </span>
          )}
          {application.salary && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <DollarSign size={12} /> {application.salary}
            </span>
          )}
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '8px', borderTop: '1px dashed var(--border-color)', fontSize: '11px', color: 'var(--text-tertiary)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} /> {new Date(application.updatedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};
