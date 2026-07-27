import React from 'react';

const Interviews: React.FC = () => {
  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-h1">面试记录与面经</h1>
          <p className="text-body" style={{ color: 'var(--text-secondary)' }}>记录面试中的高频问题与个人复盘总结。</p>
        </div>
        <button className="button" style={{ 
          backgroundColor: 'var(--accent-color)', 
          color: 'white', 
          padding: '8px 16px', 
          borderRadius: 'var(--radius-md)' 
        }}>
          添加面经
        </button>
      </div>

      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '32px',
        textAlign: 'center',
        color: 'var(--text-tertiary)'
      }}>
        <p>暂无面经记录。</p>
        <p style={{ fontSize: '12px', marginTop: '8px' }}>
          当您在投递看板将某个岗位移至“面试中”状态时，可以在此编写详细的面经。
        </p>
      </div>
    </div>
  );
};

export default Interviews;
