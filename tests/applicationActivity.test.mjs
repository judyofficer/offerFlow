import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getApplicationActivity, getStalledDays } from '../src/features/applications/utils/applicationActivity.ts';

const now = new Date('2026-10-16T12:00:00').getTime();
const day = 86400000;
const app = { id: 'test', status: 'assessment', appliedAt: now - 20 * day, updatedAt: now - 15 * day };
const event = { applicationId: 'test', date: '2026-10-17', type: 'assessment' };

test('旧数据在 14 天边界自动收池，测评适用同一规则', () => {
  assert.equal(getApplicationActivity({ ...app, updatedAt: now - 14 * day + 1 }, [], now), 'active');
  assert.equal(getApplicationActivity({ ...app, updatedAt: now - 14 * day }, [], now), 'pool');
  assert.equal(getApplicationActivity({ ...app, updatedAt: now - 8 * day }, [], now), 'active');
  assert.equal(getStalledDays(app, now), 15);
});

test('编辑备注等更新时间不会掩盖停滞；实际推进重置计时', () => {
  assert.equal(getApplicationActivity({ ...app, updatedAt: now, statusUpdatedAt: now - 15 * day }, [], now), 'pool');
  assert.equal(getApplicationActivity({ ...app, statusUpdatedAt: now }, [], now), 'active');
});

test('未来未完成日程保留活跃，已完成/归档/过期/其他岗位日程不能保活', () => {
  assert.equal(getApplicationActivity(app, [event], now), 'active');
  for (const override of [{ isCompleted: true }, { isArchived: true }, { date: '2026-10-15' }, { applicationId: 'another' }]) {
    assert.equal(getApplicationActivity(app, [{ ...event, ...override }], now), 'pool');
  }
  assert.equal(getApplicationActivity(app, [{ ...event, date: '2026-10-16', timeType: 'all_day', time: '09:00' }], now), 'active');
});

test('手动收池优先，恢复活跃有 14 天跟进窗口且保留真实停滞天数', () => {
  assert.equal(getApplicationActivity({ ...app, pooledAt: now }, [event], now), 'pool');
  const restored = { ...app, followUpAt: now };
  assert.equal(getApplicationActivity(restored, [], now), 'active');
  assert.equal(getApplicationActivity(restored, [], now + 14 * day), 'pool');
  assert.equal(getStalledDays(restored, now), 15);
});

test('已结束记录和意向岗保持各自分组', () => {
  for (const status of ['offer', 'rejected']) {
    assert.equal(getApplicationActivity({ ...app, status, pooledAt: now }, [event], now), 'closed');
  }
  assert.equal(getApplicationActivity({ ...app, status: 'wishlist' }, [], now), 'active');
});
