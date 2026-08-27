import React, { useState } from 'react';
import SuggestionCard from './SuggestionCard';

export default function Dashboard({ analysis }) {
  const [filterCategory, setFilterCategory] = useState('ALL');

  if (!analysis) {
    return (
      <div className="glass-card empty-state">
        <div className="empty-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3z"></path>
            <path d="M6 21a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v12a3 3 0 0 0 3 3z"></path>
          </svg>
        </div>
        <h2 style={{ color: '#fff', fontSize: '1.5rem' }}>No Repository Selected</h2>
        <p style={{ maxWidth: '400px', fontSize: '0.95rem' }}>
          Enter a public GitHub repository link above to clone, inspect the files, and receive actionable code improvement suggestions.
        </p>
      </div>
    );
  }

  const { repo_name, repo_url, status, error_message, suggestions = [] } = analysis;

  if (status === 'FAILED') {
    return (
      <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-rose)', background: 'rgba(239, 68, 68, 0.03)' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-rose)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifycontent: 'center', flexShrink: 0 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div>
            <h2 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '8px' }}>Analysis Failed</h2>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', marginBottom: '12px', fontWeight: '500' }}>
              Repository: <a href={repo_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>{repo_name}</a>
            </p>
            <div style={{ background: '#020617', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#f87171', whiteSpace: 'pre-wrap' }}>
              {error_message || 'An unknown error occurred during code analysis.'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate Metrics
  const totalIssues = suggestions.length;
  const countByCategory = (cat) => suggestions.filter((s) => s.category.toLowerCase() === cat.toLowerCase()).length;
  const countBySeverity = (sev) => suggestions.filter((s) => s.severity.toUpperCase() === sev.toUpperCase()).length;

  const qualityCount = countByCategory('quality');
  const securityCount = countByCategory('security');
  const optimizationCount = countByCategory('optimization');
  const readabilityCount = countByCategory('readability');

  const highSev = countBySeverity('HIGH');
  const medSev = countBySeverity('MEDIUM');
  const lowSev = countBySeverity('LOW');

  // Compute Code Health Score out of 100
  // Formula weights: High: -15, Medium: -7, Low: -2
  const computedScore = 100 - (highSev * 15 + medSev * 7 + lowSev * 2);
  const healthScore = Math.max(10, Math.min(100, computedScore));

  const getHealthColor = (score) => {
    if (score >= 85) return 'var(--accent-emerald)';
    if (score >= 60) return 'var(--accent-amber)';
    return 'var(--accent-rose)';
  };

  // Filter suggestions
  const filteredSuggestions = filterCategory === 'ALL'
    ? suggestions
    : suggestions.filter((s) => s.category.toUpperCase() === filterCategory.toUpperCase());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header Profile */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-cyan)', fontWeight: '600' }}>
            Repository Review Report
          </span>
          <h2 style={{ fontSize: '1.8rem', color: '#fff', marginTop: '4px' }}>
            {repo_name}
          </h2>
          <a href={repo_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: '#64748b', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            {repo_url}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            Active Scan
          </span>
        </div>
      </div>

      {/* Main KPI Stats Block */}
      <div className="stats-grid">
        <div className="glass-card stat-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="stat-value" style={{ color: getHealthColor(healthScore) }}>
            {healthScore}%
          </div>
          <div className="stat-label">Code Health</div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-value" style={{ color: '#fff' }}>{totalIssues}</div>
          <div className="stat-label">Total Issues</div>
        </div>

        <div className="glass-card stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#cbd5e1' }}>
            <span>High Severity</span>
            <span style={{ color: 'var(--accent-rose)', fontWeight: '700' }}>{highSev}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#cbd5e1' }}>
            <span>Medium Severity</span>
            <span style={{ color: 'var(--accent-amber)', fontWeight: '700' }}>{medSev}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#cbd5e1' }}>
            <span>Low Severity</span>
            <span style={{ color: 'var(--accent-blue)', fontWeight: '700' }}>{lowSev}</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown & Filter Tab Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>AI Suggestions</h3>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
          <button
            onClick={() => setFilterCategory('ALL')}
            style={{
              background: filterCategory === 'ALL' ? 'var(--grad-cyan)' : 'rgba(15, 23, 42, 0.5)',
              color: filterCategory === 'ALL' ? '#030712' : '#cbd5e1',
              border: '1px solid ' + (filterCategory === 'ALL' ? 'transparent' : 'var(--border-light)'),
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            All Suggestions
            <span style={{ background: filterCategory === 'ALL' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
              {totalIssues}
            </span>
          </button>

          <button
            onClick={() => setFilterCategory('QUALITY')}
            style={{
              background: filterCategory === 'QUALITY' ? 'var(--accent-cyan)' : 'rgba(15, 23, 42, 0.5)',
              color: filterCategory === 'QUALITY' ? '#030712' : '#cbd5e1',
              border: '1px solid ' + (filterCategory === 'QUALITY' ? 'transparent' : 'var(--border-light)'),
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            Code Quality
            <span style={{ background: filterCategory === 'QUALITY' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
              {qualityCount}
            </span>
          </button>

          <button
            onClick={() => setFilterCategory('SECURITY')}
            style={{
              background: filterCategory === 'SECURITY' ? 'var(--accent-rose)' : 'rgba(15, 23, 42, 0.5)',
              color: filterCategory === 'SECURITY' ? '#fff' : '#cbd5e1',
              border: '1px solid ' + (filterCategory === 'SECURITY' ? 'transparent' : 'var(--border-light)'),
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            Security
            <span style={{ background: filterCategory === 'SECURITY' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
              {securityCount}
            </span>
          </button>

          <button
            onClick={() => setFilterCategory('OPTIMIZATION')}
            style={{
              background: filterCategory === 'OPTIMIZATION' ? 'var(--accent-emerald)' : 'rgba(15, 23, 42, 0.5)',
              color: filterCategory === 'OPTIMIZATION' ? '#030712' : '#cbd5e1',
              border: '1px solid ' + (filterCategory === 'OPTIMIZATION' ? 'transparent' : 'var(--border-light)'),
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            Optimization
            <span style={{ background: filterCategory === 'OPTIMIZATION' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
              {optimizationCount}
            </span>
          </button>

          <button
            onClick={() => setFilterCategory('READABILITY')}
            style={{
              background: filterCategory === 'READABILITY' ? 'var(--accent-violet)' : 'rgba(15, 23, 42, 0.5)',
              color: filterCategory === 'READABILITY' ? '#fff' : '#cbd5e1',
              border: '1px solid ' + (filterCategory === 'READABILITY' ? 'transparent' : 'var(--border-light)'),
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            Readability
            <span style={{ background: filterCategory === 'READABILITY' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
              {readabilityCount}
            </span>
          </button>
        </div>
      </div>

      {/* Suggestion list render */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filteredSuggestions.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            {totalIssues === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h4 style={{ color: '#fff', fontSize: '1.2rem' }}>Pristine Codebase!</h4>
                <p style={{ fontSize: '0.9rem', maxWidth: '350px' }}>
                  Incredible! Our AI assistant audited this repository and found zero code smells, security flaws, or optimizations. Maintain these excellent practices!
                </p>
              </div>
            ) : (
              `No suggestions match the category filter "${filterCategory}".`
            )}
          </div>
        ) : (
          filteredSuggestions.map((sug, idx) => (
            <SuggestionCard key={sug.id || idx} suggestion={sug} />
          ))
        )}
      </div>

    </div>
  );
}
