import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

console.log('=== main.jsx is running ===');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Could not find root element');
}

createRoot(rootElement).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

console.log('=== App is rendered ===');
