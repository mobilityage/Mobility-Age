// src/components/PoseFeedback.tsx

import { useState } from 'react';
import { AnalysisResult } from '../types/assessment';
import { Card } from '@/components/ui/card';

interface PoseFeedbackProps {
  analysis: AnalysisResult;
  onContinue: () => void;
  onRetry: () => void;
  photo: string | null;
  biologicalAge: number | null;
}

export function PoseFeedback({ analysis, onContinue, onRetry, photo, biologicalAge }: PoseFeedbackProps) {
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

  const getAgeComparisonDisplay = () => {
    if (!biologicalAge) return null;
    
    const difference = analysis.mobilityAge - biologicalAge;
    const getComparisonText = () => {
      if (difference <= -5) return "Better than biological age";
      if (difference <= 0) return "Matches biological age";
      if (difference <= 5) return "Slightly above biological age";
      return "Above biological age";
    };

    const getComparisonColor = () => {
      if (difference <= -5) return "text-green-200 bg-green-500/20";
      if (difference <= 0) return "text-blue-200 bg-blue-500/20";
      if (difference <= 5) return "text-yellow-200 bg-yellow-500/20";
      return "text-red-200 bg-red-500/20";
    };

    return (
      <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${getComparisonColor()}`}>
        {getComparisonText()} ({difference > 0 ? '+' : ''}{difference} years)
      </div>
    );
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden border border-purple-300/20">
      <div className="p-6">
        {/* Photo Preview */}
        {photo && (
          <div className="mb-6 rounded-lg overflow-hidden border border-purple-300/20">
            <img 
              src={photo} 
              alt="Pose analysis" 
              className="w-full object-cover h-64"
            />
          </div>
        )}

        {/* Header with Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
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
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              analysis.isGoodForm 
                ? 'bg-green-400/20 text-green-200 border border-green-400/30' 
                : 'bg-yellow-400/20 text-yellow-200 border border-yellow-400/30'
            }`}>
              Mobility Age: {analysis.mobilityAge}
            </span>
            {getAgeComparisonDisplay()}
          </div>
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
                  
                  {/* Exercise Steps */}
                  {exercise.steps && exercise.steps.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-white text-sm font-medium mb-2">Steps:</h5>
                      <ol className="space-y-2">
                        {exercise.steps.map((step, stepIndex) => (
                          <li key={stepIndex} className="text-purple-200 text-sm flex items-start">
                            <span className="w-5 flex-shrink-0">{stepIndex + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {exercise.sets && exercise.reps && (
                      <span className="px-2 py-1 bg-purple-900/30 rounded-full text-purple-200 text-sm">
                        {exercise.sets} sets × {exercise.reps} reps
                      </span>
                    )}
                    {exercise.frequency && (
                      <span className="px-2 py-1 bg-purple-900/30 rounded-full text-purple-200 text-sm">
                        {exercise.frequency}
                      </span>
                    )}
                  </div>

                  {exercise.targetMuscles && exercise.targetMuscles.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {exercise.targetMuscles.map((muscle, idx) => (
                        <span key={idx} className="px-2 py-1 bg-purple-900/30 rounded-full text-purple-200 text-sm">
                          {muscle}
                        </span>
                      ))}
                    </div>
                  )}
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
