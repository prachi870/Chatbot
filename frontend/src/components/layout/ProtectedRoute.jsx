import { useAuth } from '../../contexts/AuthContext';

/**
 * There's no login page to gate on anymore — a guest session is created
 * silently on first load. This just waits for that bootstrap to finish
 * (showing a spinner) and surfaces a retry if it ever fails.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading, bootError, retry } = useAuth();

  if (loading) {
    return (
      <div className="bootstrap-loader" aria-label="Loading" aria-busy="true">
        <span className="spinner spinner--large" aria-hidden="true" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bootstrap-loader" role="alert">
        <p style={{ marginBottom: '1rem', color: '#f3f4f6', textAlign: 'center' }}>
          {bootError || 'Could not start a session.'}
        </p>
        <button className="btn btn-primary" onClick={retry}>
          Retry
        </button>
      </div>
    );
  }

  return children;
}
