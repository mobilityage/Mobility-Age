import { useState, useEffect } from 'react';
import Camera from '../components/Camera.tsx'; // Make sure this path is correct
import { MOBILITY_POSES } from '../types/assessment';

export default function AssessmentPage() {
  const [currentPose, setCurrentPose] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [timer, setTimer] = useState(5);
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    let interval: number;
    if (isCountingDown && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsCountingDown(false);
      setTimer(5);
    }
    return () => clearInterval(interval);
  }, [isCountingDown, timer]);

  const currentPoseData = MOBILITY_POSES[currentPose];

  const handleStartPose = () => {
    setShowInstructions(false);
    setIsCountingDown(true);
  };

  const handlePhotoTaken = (photoData: string) => {
    setPhotos([...photos, photoData]);
    if (currentPose < MOBILITY_POSES.length - 1) {
      setCurrentPose(currentPose + 1);
      setShowInstructions(true);
    } else {
      // Here we'll eventually send photos to API for analysis
      console.log("Assessment complete!");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2 text-center">
          {currentPoseData.name}
        </h2>
        <p className="text-gray-600 mb-4">{currentPoseData.description}</p>

        {showInstructions ? (
          <div className="bg-white p-4 rounded-lg shadow-md mb-4">
            <h3 className="font-bold mb-2">Setup:</h3>
            <ul className="list-disc pl-5 mb-4">
              {currentPoseData.setup.map((step, index) => (
                <li key={`setup-${index}`} className="mb-1">{step}</li>
              ))}
            </ul>
            
            <h3 className="font-bold mb-2">Steps:</h3>
            <ul className="list-disc pl-5 mb-4">
              {currentPoseData.steps.map((step, index) => (
                <li key={`step-${index}`} className="mb-1">{step}</li>
              ))}
            </ul>

            <p className="text-sm text-gray-600 mb-4">
              {currentPoseData.cameraPosition}
            </p>

            <button
              onClick={handleStartPose}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Start Pose
            </button>
          </div>
        ) : (
          <>
            {isCountingDown ? (
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-blue-500">{timer}</div>
                <p>Get into position...</p>
              </div>
            ) : (
              <Camera onPhotoTaken={handlePhotoTaken} />
            )}
          </>
        )}

        <div className="mt-4 text-center text-sm text-gray-600">
          Pose {currentPose + 1} of {MOBILITY_POSES.length}
          {photos.length > 0 && (
            <p>{photos.length} poses captured</p>
          )}
        </div>
      </div>
    </div>
  );
}
