// src/components/PoseFeedback.tsx

import { useState } from 'react';
import type { AnalysisResult } from '../types/assessment';

interface PoseFeedbackProps {
  analysis: AnalysisResult;
  onContinue: () => void;
  onRetry: () => void;
  photo: string | null;
  biologicalAge: number | null;
}

export function PoseFeedback({ 
  analysis, 
  onContinue, 
  onRetry,
  photo,
  biologicalAge
}: PoseFeedbackProps) {
  const [activeTab, setActiveTab] = useState<'feedback' | 'exercises'>('feedback');

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-400/20 text-green-200 border-green-400/30';
      case 'intermediate':
        return 'bg-yellow-400/20 text-yellow-200 border-yellow-400/30';
      case 'advanced':
        return 'bg-red-400/20 text-red-200 border-red-400/30';
      default:
        return 'bg-purple-400/20 text-purple-200 border-purple-400/30';
    }
  };

  const getAgeComparison = () => {
    if (!biologicalAge) return null;
    const diff = analysis.mobilityAge - biologicalAge;
    if (diff <= -5) return { text: "Exceptionally mobile for your age!", color: "text-green-400" };
    if (diff <= 0) return { text: "Good mobility for your age", color: "text-green-200" };
    if (diff <= 5) return { text: "Room for improvement", color: "text-yellow-200" };
    return { text: "Needs attention", color: "text-red-200" };
  };

  const ageComparison = getAgeComparison();

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden border border-purple-300/20">
      <div className="p-6">
        {photo && (
          <div className="mb-6 max-h-[50vh] rounded-lg overflow-hidden border border-purple-300/20">
            <img 
              src={photo} 
              alt="Pose analysis" 
              className="w-full h-auto object-contain"
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('feedback')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'feedback' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-purple-200 hover:bg-purple-800/30'
              }`}
            >
              Analysis
            </button>
            <button
              onClick={() => setActiveTab('exercises')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'exercises' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-purple-200 hover:bg-purple-800/30'
              }`}
            >
              Exercises
            </button>
          </div>
          <div className="flex flex-col items-end space-y-2 mt-4 sm:mt-0">
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              analysis.isGoodForm 
                ? 'bg-green-400/20 text-green-200 border border-green-400/30' 
                : 'bg-yellow-400/20 text-yellow-200 border border-yellow-400/30'
            }`}>
              Mobility Age: {analysis.mobilityAge}
            </span>
            {ageComparison && (
              <span className={`text-sm ${ageComparison.color}`}>
                {ageComparison.text}
              </span>
            )}
          </div>
        </div>

        {activeTab === 'feedback' && (
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2 text-sm font-medium text-purple-200">
                <span>Mobility Assessment</span>
                {biologicalAge && (
                  <span>Biological Age: {biologicalAge}</span>
                )}
              </div>
              <div className="h-2.5 bg-purple-900/50 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    analysis.mobilityAge <= (biologicalAge || 30) ? 'bg-green-400' :
                    analysis.mobilityAge <= (biologicalAge || 30) + 10 ? 'bg-yellow-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${Math.max(0, 100 - analysis.mobilityAge)}%` }}
                />
              </div>
            </div>

            <p className="text-purple-100 text-lg">{analysis.feedback}</p>

            {analysis.recommendations.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-white">Recommended Improvements:</h4>
                <ul className="space-y-3">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start bg-purple-800/30 rounded-lg p-4 border border-purple-300/20">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm mr-3 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-purple-100">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'exercises' && (
          <div className="space-y-6">
            <div className="grid gap-4">
              {analysis.exercises.map((exercise, index) => (
                <div key={index} className="bg-purple-800/30 rounded-lg p-4 border border-purple-300/20">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-white font-medium">{exercise.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      getDifficultyColor(exercise.difficulty)
                    }`}>
                      {exercise.difficulty}
                    </span>
                  </div>
                  <p className="text-purple-100 mb-3">{exercise.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {exercise.sets && exercise.reps && (
                      <span className="px-2 py-1 bg-purple-900/30 rounded-full text-purple-200 text-sm">
                        {exercise.sets} sets × {exercise.reps} reps
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {exercise.targetMuscles.map((muscle, idx) => (
                      <span key={idx} className="px-2 py-1 bg-purple-900/30 rounded-full text-purple-200 text-sm">
                        {muscle}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {!analysis.isGoodForm && (
            <button
              onClick={onRetry}
              className="flex-1 px-4 py-2.5 border border-purple-300/20 text-purple-100 rounded-lg
                       hover:bg-purple-800/30 active:bg-purple-700/30 transition-colors"
            >
              Try Again
            </button>
          )}
          <button
            onClick={onContinue}
            className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg
                     hover:bg-purple-500 active:bg-purple-700 transition-colors
                     shadow-lg shadow-purple-900/50"
          >
            {analysis.isGoodForm ? 'Continue' : 'Continue Anyway'}
          </button>
        </div>
      </div>
    </div>
  );
}
