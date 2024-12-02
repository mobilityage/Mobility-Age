// src/pages/PasscodePage.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PASSCODE = "123456"; // This should be moved to an environment variable
const AUTH_KEY = "mobilityAssessmentAuth";

export default function PasscodePage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already authenticated
    const isAuthenticated = localStorage.getItem(AUTH_KEY);
    if (isAuthenticated) {
      navigate('/welcome');
    }
  }, [navigate]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 6 && /^\d*$/.test(value)) {
      setCode(value);
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code === PASSCODE) {
      setSuccess(true);
      setError(null);
      localStorage.setItem(AUTH_KEY, "true");
      setTimeout(() => {
        navigate('/welcome');
      }, 500);
    } else {
      setError("Incorrect passcode. Please try again.");
      setCode("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-700 p-4">
      <div className="max-w-md mx-auto mt-20 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-purple-300/20">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Enter Passcode</h1>
          <p className="text-purple-200">
            Please enter the 6-digit code to access the assessment
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              inputMode="numeric"
              pattern="\d*"
              maxLength={6}
              value={code}
              onChange={handleInput}
              placeholder="••••••"
              className="w-full text-center text-2xl tracking-widest px-4 py-3 
                       bg-purple-900/50 border border-purple-300/20 rounded-lg 
                       text-white placeholder-purple-300/50 
                       focus:outline-none focus:border-purple-300/50"
            />
          </div>

          {error && (
            <div className="text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-300 text-sm text-center">
              Access granted! Redirecting...
            </div>
          )}

          <button
            type="submit"
            disabled={code.length !== 6 || success}
            className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg
                     hover:bg-purple-500 transition-all duration-300
                     disabled:opacity-50 disabled:cursor-not-allowed
                     font-medium shadow-lg shadow-purple-900/50"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
