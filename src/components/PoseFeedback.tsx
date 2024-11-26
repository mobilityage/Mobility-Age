interface AnalysisResult {
  score: number;
  feedback: string;
  recommendations: string[];
  isGoodForm: boolean;
}

interface PoseFeedbackProps {
  analysis: AnalysisResult;
  onContinue: () => void;
  onRetry: () => void;
}

export function PoseFeedback({ analysis, onContinue, onRetry }: PoseFeedbackProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold">Form Analysis</h3>
          <span 
            className={`px-3 py-1 rounded-full text-sm ${
              analysis.isGoodForm ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {analysis.isGoodForm ? 'Good Form' : 'Needs Adjustment'}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full mb-2">
          <div 
            className="h-2 bg-blue-500 rounded-full"
            style={{ width: `${analysis.score}%` }}
          ></div>
        </div>
        <p className="text-gray-600 mb-4">{analysis.feedback}</p>
      </div>

      {analysis.recommendations.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Recommendations:</h4>
          <ul className="list-disc pl-5 text-sm text-gray-600">
            {analysis.recommendations.map((rec, index) => (
              <li key={index} className="mb-1">{rec}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        {!analysis.isGoodForm && (
          <button
            onClick={onRetry}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Try Again
          </button>
        )}
        <button
          onClick={onContinue}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {analysis.isGoodForm ? 'Continue' : 'Continue Anyway'}
        </button>
      </div>
    </div>
  );
}
