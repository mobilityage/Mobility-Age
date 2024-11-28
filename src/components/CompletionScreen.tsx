// src/components/CompletionScreen.tsx

import { useState } from 'react';
import type { AnalysisResult, AssessmentHistory } from '../types/assessment';

interface CompletionScreenProps {
  averageAge: number;
  analyses: AnalysisResult[];
  onRestart: () => void;
  assessmentHistory: AssessmentHistory[];
  biologicalAge: number | null;
}

export function CompletionScreen({ 
  averageAge, 
  analyses, 
  onRestart, 
  assessmentHistory,
  biologicalAge 
}: CompletionScreenProps) {
  const [selectedTab, setSelectedTab] = useState<'summary' | 'history'>('summary');

  const getProgressSummary = () => {
    if (assessmentHistory.length <= 1) {
      return "Complete more assessments to track your progress over time.";
    }

    const firstAssessment = assessmentHistory[0];
    const improvement = firstAssessment.averageAge - averageAge;
    const timeElapsed = Math.round((new Date().getTime() - new Date(firstAssessment.date).getTime()) / (1000 * 60 * 60 * 24));

    return `You've improved by ${improvement.toFixed(1)} years over ${timeElapsed} days.`;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-purple-900/20 backdrop-blur-sm border border-purple-300/20">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-500/20 animate-pulse" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-200 to-transparent" />
      </div>

      <div className="relative p-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Assessment Complete!</h2>
          <p className="text-purple-200">Here's your mobility analysis</p>
          {biologicalAge && (
            <p className="text-lg mt-4 text-purple-200">
              Biological Age: <span className="text-white font-medium">{biologicalAge}</span> | 
              Mobility Age: <span className={`font-medium ${
                averageAge <= biologicalAge ? 'text-green-400' : 'text-red-400'
              }`}>{Math.round(averageAge)}</span>
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-purple-900/30 rounded-lg p-1 inline-flex">
            <button
              onClick={() => setSelectedTab('summary')}
              className={`px-4 py-2 rounded-md transition-colors ${
                selectedTab === 'summary'
                  ? 'bg-purple-600 text-white'
                  : 'text-purple-200 hover:bg-purple-800/30'
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => setSelectedTab('history')}
              className={`px-4 py-2 rounded-md transition-colors ${
                selectedTab === 'history'
                  ? 'bg-purple-600 text-white'
                  : 'text-purple-200 hover:bg-purple-800/30'
              }`}
            >
              Progress
            </button>
          </div>
        </div>

        {selectedTab === 'summary' ? (
          <>
            {/* Age Display */}
            <div className="mb-12 text-center">
              <div className="inline-block rounded-full p-1 bg-gradient-to-r from-purple-500 to-blue-500">
                <div className="bg-purple-900 rounded-full p-8">
                  <div className="text-5xl font-bold text-white mb-2">
                    {Math.round(averageAge)}
                  </div>
                  <div className="text-purple-200">Mobility Age</div>
                </div>
              </div>
            </div>

            {/* Pose Breakdown */}
            <div className="grid gap-4 mb-8">
              {analyses.map((analysis, index) => (
                <div key={index} className="bg-purple-800/20 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-purple-200">{analysis.poseName}</span>
                    <span className="text-white font-medium">Age {analysis.mobilityAge}</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-purple-900/40 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-400 to-blue-400"
                      style={{ width: `${Math.max(0, 100 - analysis.mobilityAge)}%` }}
                    />
                  </div>

                  {/* Feedback and Recommendations */}
                  <div className="mt-3 text-sm text-purple-200">
                    <p>{analysis.feedback}</p>
                    {analysis.recommendations.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {analysis.recommendations.map((rec, recIndex) => (
                          <li key={recIndex} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Exercise Recommendations */}
                  {analysis.exercises && analysis.exercises.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-white font-medium mb-2">Recommended Exercises:</h4>
                      {analysis.exercises.map((exercise, exerciseIndex) => (
                        <div key={exerciseIndex} className="mt-2 text-sm">
                          <div className="flex justify-between items-start text-purple-200">
                            <span>{exercise.name}</span>
                            <span className="text-xs bg-purple-700/50 px-2 py-1 rounded-full">
                              {exercise.difficulty}
                            </span>
                          </div>
                          {exercise.frequency && (
                            <div className="text-xs text-purple-300 mt-1">
                              {exercise.frequency}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {exercise.targetMuscles.map((muscle, muscleIndex) => (
                              <span 
                                key={muscleIndex}
                                className="text-xs bg-purple-800/50 px-2 py-0.5 rounded-full text-purple-200"
                              >
                                {muscle}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="mb-8">
            <div className="bg-purple-800/20 rounded-lg p-4">
              <h3 className="text-white font-medium mb-3">Progress Summary</h3>
              <div className="text-purple-200">
                <p className="mb-4">{getProgressSummary()}</p>
                {assessmentHistory.length > 0 && (
                  <div className="space-y-4">
                    {assessmentHistory.map((history, index) => (
                      <div 
                        key={index}
                        className="p-3 bg-purple-900/30 rounded-lg flex justify-between items-center"
                      >
                        <div>
                          <div className="text-white">
                            {new Date(history.date).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-purple-300">
                            {history.analyses.length} poses analyzed
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-medium text-white">
                            Age {Math.round(history.averageAge)}
                          </div>
                          {history.biologicalAge && (
                            <div className="text-sm text-purple-300">
                              Bio Age {history.biologicalAge}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid gap-4">
          <button
            onClick={onRestart}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 
                     text-white px-6 py-3 rounded-xl font-medium
                     hover:from-purple-500 hover:to-purple-400 
                     transition-all duration-300 shadow-lg
                     focus:ring-2 focus:ring-purple-400"
          >
            Start New Assessment
          </button>
          <button
            onClick={() => window.print()}
            className="w-full bg-purple-800/30 text-purple-200 px-6 py-3 rounded-xl
                     hover:bg-purple-700/30 transition-all duration-300
                     border border-purple-300/20"
          >
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
}
