import React from 'react';

export default function AnalysisHistory({ analyses, activeId, onSelect, onDelete }) {
  
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getStatusClass = (status) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'status-completed';
      case 'FAILED':
        return 'status-failed';
      case 'PENDING':
      default:
        return 'status-pending';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ fontSize: '1.1rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
        Review History
      </h3>
      {analyses.length === 0 ? (
        <div style={{ padding: '20px 10px', textAlign: 'center', color: '#475569', fontSize: '0.9rem' }}>
          No previous analysis reports found.
        </div>
      ) : (
        <div className="history-list">
          {analyses.map((item) => (
            <div
              key={item.id}
              className={`history-item ${activeId === item.id ? 'active' : ''}`}
              onClick={() => onSelect(item.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div className="history-name" title={item.repo_name}>
                  {item.repo_name}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Avoid selecting the history row
                    onDelete(item.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#475569',
                    cursor: 'pointer',
                    padding: '2px',
                    transition: 'color 0.2s',
                  }}
                  onMouseOver={(e) => e.target.style.color = '#ef4444'}
                  onMouseOut={(e) => e.target.style.color = '#475569'}
                  title="Delete this analysis report"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }}>
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
              <div className="history-url" title={item.repo_url}>
                {item.repo_url}
              </div>
              <div className="history-meta">
                <span>{formatDate(item.analyzed_at)}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className={`history-status-indicator ${getStatusClass(item.status)}`}></span>
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: '600' }}>
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
