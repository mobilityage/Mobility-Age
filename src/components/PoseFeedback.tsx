import { AnalysisResult } from '../services/poseAnalysisService';

interface PoseFeedbackProps {
  analysis: AnalysisResult;
  onContinue: () => void;
  onRetry: () => void;
}

export function PoseFeedback({ analysis, onContinue, onRetry }: PoseFeedbackProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Form Analysis</h3>
          <span 
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${
              analysis.isGoodForm 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
            }`}
          >
            {analysis.isGoodForm ? 'Good Form' : 'Needs Adjustment'}
          </span>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between mb-2 text-sm font-medium">
            <span className="text-gray-600">Score</span>
            <span className="text-gray-900">{analysis.score}/100</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                analysis.score >= 80 ? 'bg-green-500' :
                analysis.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${analysis.score}%` }}
            />
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 text-lg mb-4">{analysis.feedback}</p>
          
          {analysis.recommendations.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Recommendations:</h4>
              <ul className="space-y-2">
                {analysis.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm mr-2 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {!analysis.isGoodForm && (
            <button
              onClick={onRetry}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg
                         hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              Try Again
            </button>
          )}
          <button
            onClick={onContinue}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg
                       hover:bg-blue-700 active:bg-blue-800 transition-colors"
          >
            {analysis.isGoodForm ? 'Continue' : 'Continue Anyway'}
          </button>
        </div>
      </div>
    </div>
  );
}
