import React from 'react';

/**
 * Resilient Error Boundary for 3D WebGL Canvas and Model Loading
 * Prevents WebGL or GLTF parser failures from crashing the browser tab to a black screen.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught 3D Scene Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0e17',
            color: '#ffffff',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: '32px',
            textAlign: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              padding: '32px',
              borderRadius: '16px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(16px)',
              maxWidth: '520px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ color: '#0099da', fontWeight: 900, letterSpacing: '2px', marginBottom: '8px', fontSize: '13px' }}>
              /// APEX VELOCITY RECOVERY
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px', color: '#f87171' }}>
              Graphics Driver or Scene Notice
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '24px' }}>
              {this.state.error?.message || 'A WebGL context or asset loading interruption occurred.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{
                padding: '12px 28px',
                backgroundColor: '#0099da',
                border: 'none',
                borderRadius: '9999px',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '14px',
                letterSpacing: '1px',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(0, 153, 218, 0.5)',
                transition: 'transform 0.2s',
              }}
            >
              RELOAD RACE
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
