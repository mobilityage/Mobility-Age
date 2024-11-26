// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<LandingPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// LandingPage component in the same file for now
function LandingPage() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">Mobility Age Assessment</h1>
      <p className="text-lg mb-8">
        Discover your mobility age through our AI-powered assessment
      </p>
      <button 
        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
        onClick={() => alert('Assessment will start here')}
      >
        Start Assessment
      </button>
    </div>
  );
}

export default App;

// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
