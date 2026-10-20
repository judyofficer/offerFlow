import type { Application } from '../types/application';
import type { ScheduleEvent } from '../../schedule/types/schedule';

export const STALLED_DAYS = 14;
export type ActivityScope = 'active' | 'pool' | 'closed' | 'all';

export const getProgressTime = (app: Application) => app.statusUpdatedAt ?? app.updatedAt ?? app.appliedAt;
export const getStalledDays = (app: Application, now = Date.now()) =>
  Math.max(0, Math.floor((now - getProgressTime(app)) / 86400000));

export const getApplicationActivity = (app: Application, events: ScheduleEvent[], now = Date.now()): Exclude<ActivityScope, 'all'> => {
  if (['offer', 'rejected'].includes(app.status)) return 'closed';
  if (app.status === 'wishlist') return 'active';
  if (app.pooledAt) return 'pool';
  const hasUpcomingEvent = events.some(event => {
    if (event.applicationId !== app.id || event.isArchived || event.isCompleted) return false;
    const time = event.timeType === 'all_day' ? '23:59:59' : (event.time || '23:59:59');
    return new Date(`${event.date}T${time}`).getTime() >= now;
  });
  if (hasUpcomingEvent) return 'active';
  const lastFollowUp = Math.max(getProgressTime(app), app.followUpAt || 0);
  return now - lastFollowUp >= STALLED_DAYS * 86400000 ? 'pool' : 'active';
};
