// src/components/PoseFeedback.tsx

import { useState } from 'react';
import { AnalysisResult } from '../services/poseAnalysisService';

interface PoseFeedbackProps {
  analysis: AnalysisResult;
  onContinue: () => void;
  onRetry: () => void;
}

export function PoseFeedback({ analysis, onContinue, onRetry }: PoseFeedbackProps) {
  const [activeTab, setActiveTab] = useState<'feedback' | 'exercises'>('feedback');

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
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

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden border border-purple-300/20">
      <div className="p-6">
        {/* Header with Tabs */}
        <div className="flex items-center justify-between mb-6">
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
          <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
            analysis.isGoodForm 
              ? 'bg-green-400/20 text-green-200 border border-green-400/30' 
              : 'bg-yellow-400/20 text-yellow-200 border border-yellow-400/30'
          }`}>
            Mobility Age: {analysis.mobilityAge}
          </span>
        </div>

        {/* Analysis Tab Content */}
        {activeTab === 'feedback' && (
          <div className="space-y-6">
            {/* Mobility Score */}
            <div>
              <div className="flex justify-between mb-2 text-sm font-medium text-purple-200">
                <span>Mobility Assessment</span>
                <span>Age {analysis.mobilityAge}</span>
              </div>
              <div className="h-2.5 bg-purple-900/50 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    analysis.mobilityAge <= 30 ? 'bg-green-400' :
                    analysis.mobilityAge <= 45 ? 'bg-yellow-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${Math.max(0, 100 - analysis.mobilityAge)}%` }}
                />
              </div>
            </div>

            {/* Feedback */}
            <p className="text-purple-100 text-lg">{analysis.feedback}</p>

            {/* Recommendations */}
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

        {/* Exercises Tab Content */}
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
                  <div className="flex flex-wrap gap-3 text-sm">
                    {exercise.sets && exercise.reps && (
                      <span className="px-2 py-1 bg-purple-900/30 rounded-full text-purple-200">
                        {exercise.sets} sets × {exercise.reps} reps
                      </span>
                    )}
                    {exercise.targetMuscles.map((muscle, idx) => (
                      <span key={idx} className="px-2 py-1 bg-purple-900/30 rounded-full text-purple-200">
                        {muscle}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
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
