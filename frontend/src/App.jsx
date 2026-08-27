import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Import Axios for clean, promise-based HTTP client requests
import RepoInput from './components/RepoInput';
import Dashboard from './components/Dashboard';
import AnalysisHistory from './components/AnalysisHistory';

// Configure the backend API URL. 
// Uses environment variable VITE_API_URL if configured, otherwise defaults to local FastAPI port.
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function App() {
  /* ========================================================================= */
  /* React State Variables (Variables that trigger UI re-renders on change)    */
  /* ========================================================================= */
  const [analyses, setAnalyses] = useState([]);      // List of all previous repository reviews
  const [activeAnalysis, setActiveAnalysis] = useState(null); // The currently viewed repository report
  const [isLoading, setIsLoading] = useState(false);  // True while waiting for cloning or AI processing
  const [statusText, setStatusText] = useState('');   // Progressive message to display under loading spinner
  const [errorMsg, setErrorMsg] = useState('');       // Error message banner content

  // useEffect runs this code once when the app is first loaded in the browser
  useEffect(() => {
    fetchHistory();
  }, []);

  /* ========================================================================= */
  /* API Calls using Axios (Interacting with FastAPI endpoints)                */
  /* ========================================================================= */

  /**
   * Fetches all past repository reviews from the database.
   * Maps to FastAPI endpoint: GET /api/analyses
   */
  const fetchHistory = async () => {
    try {
      // Axios automatically parses JSON response data into response.data
      const response = await axios.get(`${API_BASE}/api/analyses`);
      setAnalyses(response.data);
    } catch (e) {
      console.error('Failed fetching analysis history:', e);
    }
  };

  /**
   * Fetches detailed results and AI suggestions for a specific analysis ID.
   * Maps to FastAPI endpoint: GET /api/analyses/{id}
   */
  const fetchAnalysisDetails = async (id) => {
    try {
      const response = await axios.get(`${API_BASE}/api/analyses/${id}`);
      setActiveAnalysis(response.data);
      return response.data; // Return the loaded data for the status checker
    } catch (e) {
      console.error('Failed fetching analysis details:', e);
    }
    return null;
  };

  /**
   * Initiates a new code review on a GitHub repository link.
   * Maps to FastAPI endpoint: POST /api/analyze
   */
  const startRepositoryAnalysis = async (repoUrl) => {
    setIsLoading(true);
    setErrorMsg('');
    setStatusText('Initiating repository review queue...');
    setActiveAnalysis(null);

    try {
      // Axios POST sends standard objects without needing JSON.stringify()
      const response = await axios.post(`${API_BASE}/api/analyze`, {
        repo_url: repoUrl,
      });

      // The FastAPI endpoint returns immediately with a PENDING analysis record
      const pendingRecord = response.data;
      
      // Instantly insert the pending record at the top of our sidebar list
      setAnalyses((prev) => [pendingRecord, ...prev]);
      
      // Render the current pending record so user sees the progress step
      setActiveAnalysis(pendingRecord);

      // Start the status poller to check on the background cloning/AI worker
      pollAnalysisStatus(pendingRecord.id);

    } catch (e) {
      console.error('Submission error:', e);
      
      // Axios structures server errors under e.response.data
      const serverErrorMessage = e.response?.data?.detail || e.message || 'Failed to submit repository for analysis.';
      setErrorMsg(serverErrorMessage);
      setIsLoading(false);
    }
  };

  /**
   * Periodically queries the database every 2 seconds to check if background
   * analysis is complete, failed, or still processing.
   */
  const pollAnalysisStatus = (id) => {
    setStatusText('Cloning repository files...');
    
    const interval = setInterval(async () => {
      // Fetch current status from database
      const record = await fetchAnalysisDetails(id);
      
      if (!record) {
        clearInterval(interval);
        setIsLoading(false);
        setErrorMsg('Lost connection to backend analysis engine.');
        return;
      }

      // Sync the status inside the history list in real time
      setAnalyses((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: record.status } : item))
      );

      // If status is no longer pending, stop querying the backend
      if (record.status === 'COMPLETED') {
        clearInterval(interval);
        setIsLoading(false);
        fetchHistory(); // Refresh the list to synchronize everything
      } else if (record.status === 'FAILED') {
        clearInterval(interval);
        setIsLoading(false);
        fetchHistory(); // Sync to show failure status indicators
      } else {
        // Still pending - provide progressive updates
        setStatusText('Evaluating files using LangChain LLM agents...');
      }
    }, 2000);
  };

  /**
   * Click handler when clicking an items in the history list sidebar.
   */
  const handleSelectHistory = async (id) => {
    if (isLoading) return; // Prevent switching while actively scanning a repo
    setIsLoading(true);
    await fetchAnalysisDetails(id);
    setIsLoading(false);
  };

  /**
   * Delete handler to remove a report and suggestions from the database.
   * Maps to FastAPI endpoint: DELETE /api/analyses/{id}
   */
  const handleDeleteHistory = async (id) => {
    if (isLoading) return;
    
    if (window.confirm('Are you sure you want to delete this analysis report from database history?')) {
      try {
        const response = await axios.delete(`${API_BASE}/api/analyses/${id}`);
        if (response.status === 200) {
          // Remove from local array to update the UI instantly
          setAnalyses((prev) => prev.filter((item) => item.id !== id));
          // If deleted item is the currently viewed dashboard, clear it
          if (activeAnalysis && activeAnalysis.id === id) {
            setActiveAnalysis(null);
          }
        }
      } catch (e) {
        console.error('Deletion error:', e);
      }
    }
  };

  /* ========================================================================= */
  /* Main Layout Render                                                        */
  /* ========================================================================= */
  return (
    <div className="app-container">
      {/* Sidebar - History Navigation */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'var(--grad-cyan)', padding: '8px', borderRadius: '8px', color: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em' }}>
            Review<span className="grad-text">Agent</span>
          </h2>
        </div>

        <AnalysisHistory
          analyses={analyses}
          activeId={activeAnalysis ? activeAnalysis.id : null}
          onSelect={handleSelectHistory}
          onDelete={handleDeleteHistory}
        />
      </aside>

      {/* Main Panel Content Area */}
      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', color: '#fff', fontWeight: '800' }}>
              GitHub Code Review <span className="grad-text">Assistant</span>
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
              Auditing codebase repositories with LLM-powered review boards
            </p>
          </div>
        </header>

        {/* Dynamic Error notification Banner */}
        {errorMsg && (
          <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-rose)', padding: '16px', background: 'rgba(239, 68, 68, 0.02)' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-rose)" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '500' }}>Error: {errorMsg}</span>
            </div>
          </div>
        )}

        {/* Input box to add repo URL */}
        <RepoInput
          onSubmit={startRepositoryAnalysis}
          isLoading={isLoading && activeAnalysis && activeAnalysis.status === 'PENDING'}
          statusText={statusText}
        />

        {/* Interactive Stats Dashboard and Suggestions cards */}
        <Dashboard analysis={activeAnalysis} />
      </main>
    </div>
  );
}
