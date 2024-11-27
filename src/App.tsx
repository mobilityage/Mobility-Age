// App.tsx
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import AssessmentPage from './pages/AssessmentPage';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-700 text-white">
      <div className="relative h-screen">
        {/* Mountain Silhouettes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute bottom-0 w-full">
            <svg viewBox="0 0 1440 320" className="w-full" preserveAspectRatio="none">
              <path fill="rgb(88, 28, 135)" d="M0,224L80,208C160,192,320,160,480,165.3C640,171,800,213,960,224C1120,235,1280,213,1360,202.7L1440,192L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
              <path fill="rgb(67, 20, 104)" d="M0,288L80,277.3C160,267,320,245,480,240C640,235,800,245,960,250.7C1120,256,1280,256,1360,256L1440,256L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
              <path fill="rgb(46, 16, 101)" d="M0,288L80,282.7C160,277,320,267,480,266.7C640,267,800,277,960,282.7C1120,288,1280,288,1360,288L1440,288L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 space-y-8">
          <h1 className="text-5xl font-bold text-center">
            Discover Your Mobility Age
          </h1>
          <p className="text-xl text-center max-w-2xl text-purple-100">
            Understand your body's true mobility potential through our AI-powered assessment
          </p>
          <button 
            onClick={() => navigate('/assessment')}
            className="px-8 py-4 text-lg font-medium text-white bg-purple-600 rounded-lg
                     hover:bg-purple-500 transition-colors duration-300
                     shadow-lg hover:shadow-xl"
          >
            Start Your Assessment
          </button>
        </div>

        {/* Stars */}
        <div className="absolute inset-0 z-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                top: `${Math.random() * 60}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-700">
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
