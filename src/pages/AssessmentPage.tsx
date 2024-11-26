import { useState, useEffect } from 'react';
import { MOBILITY_POSES } from '../types/assessment';
import Camera from '@/components/Camera';
import { PoseInstructions } from '@/components/PoseInstructions';

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
          <PoseInstructions 
            poseData={currentPoseData}
            onStartPose={handleStartPose}
          />
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
          <p>Pose {currentPose + 1} of {MOBILITY_POSES.length}</p>
          {photos.length > 0 && (
            <p>{photos.length} poses captured</p>
          )}
        </div>
      </div>
    </div>
  );
}
