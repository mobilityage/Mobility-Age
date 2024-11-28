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

  const getAgeDifference = () => {
    if (!biologicalAge) return null;
    const diff = averageAge - biologicalAge;
    if (diff <= -5) return { text: "Exceptional mobility for your age!", color: "text-green-400" };
    if (diff <= 0) return { text: "Good mobility for your age", color: "text-green-200" };
    if (diff <= 5) return { text: "Room for improvement", color: "text-yellow-200" };
    return { text: "Needs attention", color: "text-red-200" };
  };

  const ageDifference = getAgeDifference();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-purple-900/20 backdrop-blur-sm border border-purple-300/20">
      <div className="relative p-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Assessment Complete!</h2>
          <p className="text-purple-200">Here's your mobility analysis</p>
          {biologicalAge && ageDifference && (
            <p className="text-lg mt-4">
              <span className={ageDifference.color}>{ageDifference.text}</span>
            </p>
          )}
        </div>

        {/* Age Display */}
        <div className="mb-12 text-center">
          <div className="inline-block rounded-full p-1 bg-gradient-to-r from-purple-500 to-blue-500">
            <div className="bg-purple-900 rounded-full p-8">
              <div className="text-5xl font-bold text-white mb-2">
                {Math.round(averageAge)}
              </div>
              <div className="text-purple-200">Mobility Age</div>
              {biologicalAge && (
                <div className="text-sm text-purple-300 mt-1">
                  Biological Age: {biologicalAge}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-6">
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
          <div className="space-y-6">
            {/* Pose Results */}
            {analyses.map((analysis, index) => (
              <div key={index} className="bg-purple-800/20 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-white font-medium">{analysis.poseName}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    analysis.isGoodForm ? 'bg-green-400/20 text-green-200' : 'bg-yellow-400/20 text-yellow-200'
                  }`}>
                    Age {analysis.mobilityAge}
                  </span>
                </div>

                <p className="text-purple-200 text-sm mb-3">{analysis.feedback}</p>

                {analysis.recommendations.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-white text-sm font-medium mb-2">Recommendations:</h4>
                    <ul className="space-y-1">
                      {analysis.recommendations.map((rec, recIndex) => (
                        <li key={recIndex} className="text-purple-200 text-sm flex">
                          <span className="mr-2">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.exercises.map((exercise, exIndex) => (
                  <div key={exIndex} className="mt-4 bg-purple-900/30 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-white text-sm font-medium">{exercise.name}</h4>
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-800/50 text-purple-200">
                        {exercise.difficulty}
                      </span>
                    </div>
                    <p className="text-purple-200 text-sm mb-2">{exercise.description}</p>
                    {exercise.frequency && (
                      <p className="text-purple-300 text-xs">Frequency: {exercise.frequency}</p>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {assessmentHistory.length > 0 ? (
              <>
                <div className="bg-purple-800/20 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-3">Progress History</h3>
                  <div className="space-y-3">
                    {assessmentHistory.map((history, index) => (
                      <div key={index} className="bg-purple-900/30 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-purple-200">{formatDate(history.date)}</span>
                          <span className="text-white font-medium">Age {Math.round(history.averageAge)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-purple-200">
                Complete more assessments to see your progress over time.
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid gap-4 mt-8">
          <button
            onClick={onRestart}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 
                     text-white px-6 py-3 rounded-xl font-medium
                     hover:from-purple-500 hover:to-purple-400 
                     transition-all duration-300 shadow-lg"
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
