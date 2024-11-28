// src/components/CompletionScreen.tsx

import { useState } from 'react';
import type { AnalysisResult, AssessmentHistory } from '../types/assessment';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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

  const getAgeComparison = () => {
    if (!biologicalAge) return null;
    const difference = averageAge - biologicalAge;
    const getAssessment = () => {
      if (difference <= -5) return "Your mobility is exceptionally good for your age!";
      if (difference <= 0) return "Your mobility matches your biological age.";
      if (difference <= 5) return "Your mobility shows room for improvement.";
      return "Your mobility needs attention to better align with your age.";
    };

    const getColor = () => {
      if (difference <= -5) return "text-green-200";
      if (difference <= 0) return "text-blue-200";
      if (difference <= 5) return "text-yellow-200";
      return "text-red-200";
    };

    return (
      <div className="mb-6 text-center">
        <p className={`text-lg ${getColor()}`}>
          {getAssessment()}
        </p>
        <p className="text-purple-200 mt-2">
          Mobility Age: {Math.round(averageAge)} | Biological Age: {biologicalAge}
        </p>
      </div>
    );
  };

  const getProgressData = () => {
    return assessmentHistory.map(history => ({
      date: new Date(history.date).toLocaleDateString(),
      age: history.averageAge,
      biological: history.biologicalAge
    }));
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
            {getAgeComparison()}

            {/* Age Display */}
            <div className="mb-12">
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
                  <div className="flex justify-between items-center">
                    <span className="text-purple-200">{analysis.poseName}</span>
                    <span className="text-white font-medium">Age {analysis.mobilityAge}</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-purple-900/40 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-400 to-blue-400"
                      style={{ width: `${Math.max(0, 100 - analysis.mobilityAge)}%` }}
                    />
                  </div>

                  {/* Exercise Recommendations */}
                  {analysis.exercises && analysis.exercises.length > 0 && (
                    <div className="mt-4">
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
                          {exercise.targetMuscles && exercise.targetMuscles.length > 0 && (
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
                          )}
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
            <div className="bg-purple-800/20 rounded-lg p-4 mb-6">
              <h3 className="text-white font-medium mb-4">Mobility Progress</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getProgressData()} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <XAxis 
                      dataKey="date" 
                      stroke="#E9D5FF" 
                      fontSize={12}
                      tickMargin={8}
                    />
                    <YAxis 
                      stroke="#E9D5FF" 
                      fontSize={12}
                      tickMargin={8}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(88, 28, 135, 0.8)',
                        border: '1px solid rgba(147, 51, 234, 0.3)',
                        borderRadius: '8px',
                        backdropFilter: 'blur(8px)',
                      }}
                      labelStyle={{ color: '#E9D5FF' }}
                      itemStyle={{ color: '#E9D5FF' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="age" 
                      stroke="#9333EA" 
                      strokeWidth={2}
                      name="Mobility Age"
                      dot={{ fill: '#9333EA', strokeWidth: 2 }}
                    />
                    {biologicalAge && (
                      <Line 
                        type="monotone" 
                        dataKey="biological" 
                        stroke="#60A5FA" 
                        strokeWidth={2}
                        name="Biological Age"
                        strokeDasharray="4 4"
                        dot={{ fill: '#60A5FA', strokeWidth: 2 }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-purple-800/20 rounded-lg p-4">
              <h3 className="text-white font-medium mb-3">Progress Summary</h3>
              {assessmentHistory.length > 1 ? (
                <div className="space-y-2 text-purple-200">
                  <p>
                    Initial Mobility Age: {Math.round(assessmentHistory[0].averageAge)}
                  </p>
                  <p>
                    Current Mobility Age: {Math.round(averageAge)}
                  </p>
                  <p>
                    Total Improvement: {Math.round(assessmentHistory[0].averageAge - averageAge)} years
                  </p>
                </div>
              ) : (
                <p className="text-purple-200">
                  Complete more assessments to track your progress over time.
                </p>
              )}
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
