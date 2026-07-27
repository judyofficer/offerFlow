import React from 'react';

const Interviews: React.FC = () => {
  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-h1">Interviews & Notes</h1>
          <p className="text-body" style={{ color: 'var(--text-secondary)' }}>Record your interview questions and personal reflections.</p>
        </div>
        <button className="button" style={{ 
          backgroundColor: 'var(--accent-color)', 
          color: 'white', 
          padding: '8px 16px', 
          borderRadius: 'var(--radius-md)' 
        }}>
          Add Note
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
        <p>No interview records yet.</p>
        <p style={{ fontSize: '12px', marginTop: '8px' }}>
          When you move an application to "Interviewing" status, you can create notes here.
        </p>
      </div>
    </div>
  );
};

export default Interviews;
