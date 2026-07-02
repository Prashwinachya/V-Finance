import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-rose-50">
          <h1 className="text-2xl font-bold text-rose-600">Something went wrong.</h1>
          <pre className="mt-4 text-sm">{this.state.error?.message || 'Unknown error'}</pre>
          <pre className="mt-2 text-xs text-slate-500">{this.state.error?.stack || ''}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
