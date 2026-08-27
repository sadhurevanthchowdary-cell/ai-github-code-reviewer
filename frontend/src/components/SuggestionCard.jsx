import React from 'react';

export default function SuggestionCard({ suggestion }) {
  const {
    file_path,
    file_language,
    line_number,
    category,
    severity,
    title,
    description,
    suggestion_code,
    original_code,
  } = suggestion;

  // Icons matching categories
  const getCategoryIcon = (cat) => {
    switch (cat.toLowerCase()) {
      case 'security':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        );
      case 'optimization':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
        );
      case 'readability':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
        );
      case 'quality':
      default:
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        );
    }
  };

  return (
    <div className="glass-card suggestion-card">
      <div className="card-header">
        <div>
          <div className="card-tags">
            <span className={`badge badge-${category.toLowerCase()}`}>
              {getCategoryIcon(category)}
              <span style={{ marginLeft: '6px' }}>{category}</span>
            </span>
            <span className={`badge badge-${severity.toLowerCase()}`}>
              {severity}
            </span>
          </div>
          <h3 className="card-title">{title}</h3>
        </div>
      </div>

      <div className="card-meta">
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          {file_path}{line_number ? ` : L${line_number}` : ''}
        </span>
        <span style={{ textTransform: 'uppercase', color: '#475569' }}>
          {file_language}
        </span>
      </div>

      <p className="card-description">{description}</p>

      {/* Code diff display */}
      {(original_code || suggestion_code) && (
        <div className="code-diff-container">
          {original_code && (
            <div className="code-panel panel-original">
              <div className="panel-header">
                <span>Offending Code</span>
                <span style={{ fontSize: '0.7rem' }}>Line {line_number || 'N/A'}</span>
              </div>
              <pre className="code-block"><code>{original_code.trim()}</code></pre>
            </div>
          )}

          {suggestion_code && (
            <div className="code-panel panel-suggested">
              <div className="panel-header">
                <span>Proposed Fix</span>
                <span>Optimized</span>
              </div>
              <pre className="code-block"><code>{suggestion_code.trim()}</code></pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
