// src/components/PoseInstructions.tsx

import type { PoseInstruction } from '../types/assessment';

interface PoseInstructionsProps {
  poseData: PoseInstruction;
  onStartPose: () => void;
}

export function PoseInstructions({ poseData, onStartPose }: PoseInstructionsProps) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden border border-purple-300/20">
      <div className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">{poseData.name}</h2>
          <p className="text-purple-200">{poseData.description}</p>
        </div>

        {/* Setup Instructions */}
        <div className="mb-6">
          <h3 className="text-white font-medium mb-3">Setup</h3>
          <ul className="space-y-2">
            {poseData.setup.map((step, index) => (
              <li key={index} className="flex items-start text-purple-200">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 
                               text-white flex items-center justify-center text-sm mr-3 mt-0.5">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div className="mb-6">
          <h3 className="text-white font-medium mb-3">Steps</h3>
          <ul className="space-y-2">
            {poseData.steps.map((step, index) => (
              <li key={index} className="flex items-start text-purple-200">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 
                               text-white flex items-center justify-center text-sm mr-3 mt-0.5">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Camera Position */}
        <div className="mb-8 bg-purple-900/30 rounded-lg p-4">
          <h3 className="text-white font-medium mb-2">Camera Position</h3>
          <p className="text-purple-200">{poseData.cameraPosition}</p>
        </div>

        {/* Start Button */}
        <button
          onClick={onStartPose}
          className="w-full bg-purple-600 text-white px-6 py-3 rounded-xl
                   hover:bg-purple-500 transition-colors duration-300
                   font-medium shadow-lg shadow-purple-900/50"
        >
          Start Pose
        </button>
      </div>
    </div>
  );
}
