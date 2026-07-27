import React from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';
import { useApplicationStore } from '../../store/useApplicationStore';
import { STATUS_CONFIG } from '../../types/application';
import type { ApplicationStatus } from '../../types/application';
import styles from './Applications.module.css';

const COLUMNS: ApplicationStatus[] = ['wishlist', 'applied', 'oa', 'interview', 'hr', 'offer', 'rejected'];

const Applications: React.FC = () => {
  const { applications, addApplication, updateApplicationStatus } = useApplicationStore();

  const handleAddNew = () => {
    const company = prompt('Enter Company Name:');
    if (!company) return;
    const title = prompt('Enter Job Title:');
    if (!title) return;
    
    addApplication({
      companyName: company,
      jobTitle: title,
      jobDescription: '',
      status: 'wishlist'
    });
  };

  const handleStatusChange = (appId: string, currentStatus: ApplicationStatus) => {
    const newStatus = prompt(`Move from ${STATUS_CONFIG[currentStatus].label} to (wishlist, applied, oa, interview, hr, offer, rejected):`);
    if (newStatus && COLUMNS.includes(newStatus as ApplicationStatus)) {
      updateApplicationStatus(appId, newStatus as ApplicationStatus);
    } else if (newStatus) {
      alert('Invalid status entered.');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className="text-h1">投递记录看板</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>追踪所有的岗位投递状态与进展。</p>
        </div>
        <button className={styles.button} onClick={handleAddNew}>
          <Plus size={16} /> 添加岗位
        </button>
      </header>

      <div className={styles.kanbanBoard}>
        {COLUMNS.map(status => {
          const config = STATUS_CONFIG[status];
          const columnApps = applications.filter(app => app.status === status);
          
          return (
            <div key={status} className={styles.column}>
              <div className={styles.columnHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: config.color }}></span>
                  {config.label}
                </div>
                <span className={styles.columnBadge}>{columnApps.length}</span>
              </div>
              
              <div className={styles.cardList}>
                {columnApps.map(app => (
                  <div key={app.id} className={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className={styles.cardTitle}>{app.jobTitle}</div>
                      <button onClick={() => handleStatusChange(app.id, app.status)} style={{ color: 'var(--text-tertiary)' }}>
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                    <div className={styles.cardCompany}>{app.companyName}</div>
                    <div className={styles.cardFooter}>
                      <span>{new Date(app.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Applications;
