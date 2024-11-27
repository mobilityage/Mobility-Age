// src/components/LandingPage.tsx
export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative bg-gradient-to-b from-purple-900 via-purple-800 to-purple-700 overflow-hidden">
      {/* Curved Shape at Bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 200" className="w-full">
          <path 
            fill="rgb(88, 28, 135)" 
            d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,85.3C672,75,768,85,864,112C960,139,1056,181,1152,181.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>

      {/* Content */}
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
            <svg className="ml-2 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
      </div>
    </div>
  );
}
