import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-midnight-900 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
          <FaExclamationTriangle className="text-danger mb-4 mx-auto" size={48} />
          <h1 className="text-2xl font-black text-text-primary uppercase mb-2">Something went wrong.</h1>
          <p className="text-text-muted mb-6 max-w-md">Our dark mode elves encountered an unexpected error while rendering this page. A refresh usually does the trick.</p>
          <button 
            className="btn-primary" 
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children; 
  }
}

export default ErrorBoundary;
