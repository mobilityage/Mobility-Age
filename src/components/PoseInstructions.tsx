import React from 'react';
import type { PoseInstruction } from '../types/assessment';
import { Info } from 'lucide-react';

interface PoseInstructionsProps {
  poseData: PoseInstruction;
  onStartPose: () => void;
  referenceImage: string;
}

export function PoseInstructions({ poseData, onStartPose, referenceImage }: PoseInstructionsProps) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden border border-purple-300/20">
      <div className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">{poseData.name}</h2>
          <p className="text-purple-200">{poseData.description}</p>
        </div>

        {/* Reference Image */}
        <div className="mb-6 relative aspect-[3/4] rounded-xl overflow-hidden border border-purple-300/20">
          <img 
            src={referenceImage}
            alt={`Reference pose for ${poseData.name}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-900/90 to-transparent p-4">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-purple-300" />
              <span className="text-sm text-purple-200">Reference Pose</span>
            </div>
          </div>
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
          
          <div className="mt-4 pt-4 border-t border-purple-300/20">
            <h4 className="text-white font-medium mb-2">Photo Tips</h4>
            <ul className="space-y-2 text-sm text-purple-200">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                <span>Use portrait orientation</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                <span>Ensure your full body is visible</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                <span>Find good lighting and a clear background</span>
              </li>
            </ul>
          </div>
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
