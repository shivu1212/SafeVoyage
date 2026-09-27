import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            padding: '2rem',
            borderRadius: '12px',
            backgroundColor: 'var(--bg-subtle, #F8FAFC)',
            border: '1px solid var(--border-color, #E2E8F0)',
            textAlign: 'center',
            margin: '1rem 0'
          }}
        >
          <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#EF4444', marginBottom: '1rem' }}>
            <AlertTriangle size={28} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main, #0F172A)', marginBottom: '0.5rem' }}>
            {this.props.title || 'Component temporarily unavailable'}
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary, #64748B)', maxWidth: '480px', margin: '0 auto 1.25rem' }}>
            {this.props.description || 'An unexpected rendering issue occurred. You can retry loading this section.'}
          </p>
          <button
            onClick={this.handleReset}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
