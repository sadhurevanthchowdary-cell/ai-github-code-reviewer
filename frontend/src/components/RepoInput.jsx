import React, { useState, useEffect } from 'react';

export default function RepoInput({ onSubmit, isLoading, statusText }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  // Simulated step transitions to give highly granular loading progress and maintain high engagement
  const steps = [
    'Establishing connection to GitHub...',
    'Performing shallow Git clone (depth=1)...',
    'Filtering Python, JavaScript, and Java files...',
    'Injecting codebase chunks into LangChain pipeline...',
    'Generating review suggestions via OpenAI API...',
    'Writing report metrics to PostgreSQL database...'
  ];

  useEffect(() => {
    let interval;
    if (isLoading) {
      setCurrentStep(0);
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < steps.length - 1) return prev + 1;
          return prev; // Hold on last step until backend updates completed
        });
      }, 3500);
    } else {
      setCurrentStep(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const validateUrl = (input) => {
    const trimmed = input.trim();
    const pattern = /^https?:\/\/(www\.)?github\.com\/[\w\-\.]+\/[\w\-\.]+(\.git)?\/?$/;
    if (!trimmed) {
      setError('');
      return false;
    }
    if (!pattern.test(trimmed)) {
      setError('Please enter a valid GitHub repository HTTPS URL (e.g., https://github.com/owner/repo)');
      return false;
    }
    setError('');
    return true;
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setUrl(value);
    validateUrl(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateUrl(url)) {
      onSubmit(url.trim());
    }
  };

  return (
    <div className="glass-card">
      {!isLoading ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontSize: '1.4rem', color: '#fff' }}>Analyze a Repository</h2>
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
            Provide the URL of any public GitHub repository. Our AI assistant will clone it, inspect Python, JavaScript/TypeScript, and Java files, and evaluate potential issues.
          </p>
          <div className="input-group">
            <input
              type="text"
              className="custom-input"
              placeholder="e.g. https://github.com/fastapi/fastapi"
              value={url}
              onChange={handleInputChange}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading || !url || !!error}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              Analyze
            </button>
          </div>
          {error && <span style={{ fontSize: '0.85rem', color: '#ef4444', marginTop: '4px' }}>{error}</span>}
        </form>
      ) : (
        <div className="loading-wrapper">
          <div className="spinner-outer"></div>
          <div style={{ marginTop: '8px' }}>
            <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '8px' }}>
              Analyzing Repository
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#00f2fe', fontWeight: '500', minHeight: '24px' }}>
              {statusText || steps[currentStep]}
            </p>
          </div>
          
          <div className="steps-list">
            {steps.map((step, idx) => {
              let stepClass = 'step-item';
              if (idx < currentStep) stepClass += ' completed';
              else if (idx === currentStep) stepClass += ' active';
              
              return (
                <div key={idx} className={stepClass}>
                  <div className="step-dot"></div>
                  <span>{step.replace(/\.\.\.$/, '')}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
