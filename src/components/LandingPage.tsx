import { useNavigate } from 'react-router-dom';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative bg-gradient-to-b from-purple-900 via-purple-800 to-purple-700 overflow-hidden">
      <div className="relative z-10 container mx-auto px-4 pt-20 pb-32">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Discover Your Mobility Age
          </h1>
          <p className="text-xl md:text-2xl text-purple-100 mb-12">
            Understand your body's true mobility potential through our AI-powered assessment
          </p>
          <button
            onClick={() => navigate('/assessment')}
            className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white
                     bg-gradient-to-r from-purple-600 to-purple-500
                     rounded-lg shadow-lg hover:from-purple-500 hover:to-purple-400
                     transform transition-all duration-300 hover:scale-105
                     focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Start Your Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
