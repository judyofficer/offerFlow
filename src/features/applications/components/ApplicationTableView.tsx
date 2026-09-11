import React, { useState, useMemo } from 'react';
import type { Application, ApplicationStatus, ApplicationPriority } from '../types/application';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../types/application';
import { useResumeStore } from '../../resumes/store/useResumeStore';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  ExternalLink, 
  CalendarPlus, 
  Trash2, 
  FileText,
  Clock,
  Eye,
  ChevronDown
} from 'lucide-react';
import styles from './ApplicationTableView.module.css';

interface Props {
  applications: Application[];
  onSelectApp: (appId: string) => void;
  onStatusChange: (appId: string, newStatus: ApplicationStatus) => void;
  onPriorityChange: (appId: string, newPriority: ApplicationPriority) => void;
  onAddSchedule: (app: Application) => void;
  onDelete: (appId: string) => void;
}

type SortField = 'companyName' | 'jobTitle' | 'priority' | 'status' | 'updatedAt' | 'appliedAt';
type SortOrder = 'asc' | 'desc';

export const ApplicationTableView: React.FC<Props> = ({
  applications,
  onSelectApp,
  onStatusChange,
  onPriorityChange,
  onAddSchedule,
  onDelete,
}) => {
  const { resumes } = useResumeStore();
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // 简历字典映射缓存
  const resumeMap = useMemo(() => {
    const map = new Map<string, string>();
    resumes.forEach(r => map.set(r.id, r.name));
    return map;
  }, [resumes]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder(field === 'updatedAt' || field === 'appliedAt' || field === 'priority' ? 'desc' : 'asc');
    }
  };

  const sortedApplications = useMemo(() => {
    return [...applications].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'companyName') {
        comparison = (a.companyName || '').localeCompare(b.companyName || '', 'zh-CN');
      } else if (sortField === 'jobTitle') {
        comparison = (a.jobTitle || '').localeCompare(b.jobTitle || '', 'zh-CN');
      } else if (sortField === 'priority') {
        const weightA = PRIORITY_CONFIG[a.priority || 'target']?.weight ?? 2;
        const weightB = PRIORITY_CONFIG[b.priority || 'target']?.weight ?? 2;
        comparison = weightA - weightB;
      } else if (sortField === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '');
      } else if (sortField === 'appliedAt') {
        comparison = (a.appliedAt || 0) - (b.appliedAt || 0);
      } else {
        comparison = (a.updatedAt || 0) - (b.updatedAt || 0);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [applications, sortField, sortOrder]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={13} style={{ opacity: 0.35, marginLeft: '4px' }} />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp size={13} style={{ color: 'var(--primary)', marginLeft: '4px' }} />
    ) : (
      <ArrowDown size={13} style={{ color: 'var(--primary)', marginLeft: '4px' }} />
    );
  };

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
            <tr>
              <th 
                className={`${styles.th} ${styles.thSortable}`} 
                onClick={() => handleSort('companyName')}
                style={{ width: '240px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span>公司与投递岗位</span>
                  {renderSortIcon('companyName')}
                </div>
              </th>

              <th 
                className={`${styles.th} ${styles.thSortable}`} 
                onClick={() => handleSort('priority')}
                style={{ width: '130px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span>意向梯队</span>
                  {renderSortIcon('priority')}
                </div>
              </th>

              <th 
                className={`${styles.th} ${styles.thSortable}`} 
                onClick={() => handleSort('status')}
                style={{ width: '130px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span>当前状态</span>
                  {renderSortIcon('status')}
                </div>
              </th>

              <th className={styles.th} style={{ width: '150px' }}>
                地点与薪资
              </th>

              <th className={styles.th} style={{ width: '150px' }}>
                关联简历
              </th>

              <th 
                className={`${styles.th} ${styles.thSortable}`} 
                onClick={() => handleSort('updatedAt')}
                style={{ width: '120px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span>更新时间</span>
                  {renderSortIcon('updatedAt')}
                </div>
              </th>

              <th className={styles.th} style={{ width: '110px', textAlign: 'right' }}>
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedApplications.map(app => {
              const priority = app.priority || 'target';
              const pConfig = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.target;
              const statusConfig = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied;
              const resumeName = app.resumeId ? resumeMap.get(app.resumeId) : null;

              return (
                <tr 
                  key={app.id} 
                  className={styles.tr}
                  onClick={() => onSelectApp(app.id)}
                >
                  {/* 1. 公司与岗位 */}
                  <td className={styles.td}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
                          {app.companyName || '未知公司'}
                        </span>
                        {app.url && (
                          <a
                            href={app.url.startsWith('http') ? app.url : `https://${app.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className={styles.linkTag}
                            title={`打开招聘链接: ${app.url}`}
                          >
                            <ExternalLink size={11} />
                            <span>官网</span>
                          </a>
                        )}
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        {app.jobTitle || '未命名岗位'}
                      </div>
                    </div>
                  </td>

                  {/* 2. 意向梯队 (直接可切下拉) */}
                  <td className={styles.td} onClick={e => e.stopPropagation()}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <select
                        value={priority}
                        onChange={e => onPriorityChange(app.id, e.target.value as ApplicationPriority)}
                        className={styles.badgeSelect}
                        style={{
                          backgroundColor: pConfig.bgColor,
                          color: pConfig.color,
                          border: `1px solid ${pConfig.borderColor}`,
                          paddingRight: '18px',
                          fontWeight: 500,
                        }}
                        title="点击快速修改意向度/难度梯队"
                      >
                        <option value="dream">冲刺 (重点)</option>
                        <option value="target">主攻 (核心)</option>
                        <option value="safety">保底 (稳健)</option>
                      </select>
                      <ChevronDown size={11} style={{ position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: pConfig.color }} />
                    </div>
                  </td>

                  {/* 3. 当前状态 (直接可切下拉) */}
                  <td className={styles.td} onClick={e => e.stopPropagation()}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <select
                        value={app.status}
                        onChange={e => onStatusChange(app.id, e.target.value as ApplicationStatus)}
                        className={styles.badgeSelect}
                        style={{
                          backgroundColor: statusConfig.bgColor || 'rgba(59, 130, 246, 0.12)',
                          color: statusConfig.color,
                          border: `1px solid ${statusConfig.color}40`,
                          paddingRight: '20px',
                        }}
                        title="点击快速推进/流转投递状态"
                      >
                        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                          <option key={key} value={key}>{cfg.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={11} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: statusConfig.color }} />
                    </div>
                  </td>

                  {/* 4. 地点与薪资 */}
                  <td className={styles.td}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px' }}>
                      {app.location || app.salary ? (
                        <>
                          {app.location && <span style={{ color: 'var(--text-primary)' }}>{app.location}</span>}
                          {app.salary && <span style={{ color: 'var(--text-tertiary)' }}>{app.salary}</span>}
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                      )}
                    </div>
                  </td>

                  {/* 5. 关联简历 */}
                  <td className={styles.td}>
                    {resumeName ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <FileText size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={resumeName}>
                          {resumeName}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>未关联</span>
                    )}
                  </td>

                  {/* 6. 更新时间 */}
                  <td className={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      <Clock size={11} />
                      <span>{new Date(app.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </td>

                  {/* 7. 操作 */}
                  <td className={styles.td} style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => onSelectApp(app.id)}
                        className="btn btn-ghost btn-icon btn-sm"
                        title="查看详情"
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onAddSchedule(app)}
                        className="btn btn-ghost btn-icon btn-sm"
                        title="添加面试/笔试日程"
                        style={{ color: 'var(--primary)' }}
                      >
                        <CalendarPlus size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(app.id)}
                        className="btn btn-ghost btn-icon btn-sm"
                        title="删除记录"
                        style={{ color: 'var(--danger)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {sortedApplications.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '64px 16px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  没有找到符合条件的岗位记录。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
