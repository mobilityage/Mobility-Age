import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import AssessmentPage from './pages/AssessmentPage';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">Mobility Age Assessment</h1>
      <p className="text-lg mb-8">
        Discover your mobility age through our AI-powered assessment
      </p>
      <button 
        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
        onClick={() => navigate('/assessment')}
      >
        Start Assessment
      </button>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/assessment" element={<AssessmentPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
