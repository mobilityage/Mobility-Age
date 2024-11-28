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
    if (diff <= -5) return { text: "Your mobility is exceptional!", color: "text-green-400" };
    if (diff <= 0) return { text: "Your mobility matches your age", color: "text-green-200" };
    if (diff <= 5) return { text: "Your mobility needs some work", color: "text-yellow-200" };
    return { text: "Your mobility needs attention", color: "text-red-200" };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const ageDifference = getAgeDifference();

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden border border-purple-300/20">
      <div className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Assessment Complete!</h2>
          <p className="text-purple-200">Your Mobility Analysis</p>
          {biologicalAge && ageDifference && (
            <p className={`text-lg mt-4 ${ageDifference.color}`}>
              {ageDifference.text}
            </p>
          )}
        </div>

        <div className="mb-8 text-center">
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
              History
            </button>
          </div>
        </div>

        {selectedTab === 'summary' ? (
          <div className="space-y-6">
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

                <p className="text-purple-200 text-sm mb-4">{analysis.feedback}</p>

                <div className="space-y-2">
                  {analysis.recommendations.map((rec, recIndex) => (
                    <p key={recIndex} className="text-purple-200 text-sm flex">
                      <span className="mr-2">•</span>
                      <span>{rec}</span>
                    </p>
                  ))}
                </div>

                {analysis.exercises.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-purple-300/20">
                    <h4 className="text-white text-sm font-medium mb-2">Recommended Exercises:</h4>
                    {analysis.exercises.map((exercise, exIndex) => (
                      <div key={exIndex} className="mb-2">
                        <p className="text-purple-200 text-sm">
                          <span className="font-medium">{exercise.name}</span>
                          {exercise.sets && exercise.reps && (
                            <span className="ml-2 opacity-75">
                              ({exercise.sets} × {exercise.reps})
                            </span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {assessmentHistory.map((history, index) => (
              <div key={index} className="bg-purple-800/20 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-purple-200">{formatDate(history.date)}</span>
                  <div className="text-right">
                    <span className="text-white font-medium">Age {Math.round(history.averageAge)}</span>
                    {history.biologicalAge && (
                      <span className="text-purple-300 text-sm ml-2">
                        (Bio: {history.biologicalAge})
                      </span>
                    )}
                  </div>
