import { useState } from 'react';
import Camera from '../components/Camera';

export default function AssessmentPage() {
  const [currentPose, setCurrentPose] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);

  const poses = [
    "Stand straight with arms by your sides",
    "Reach up as high as you can",
    "Touch your toes (or reach as far as comfortable)",
    "Stand on one leg"
  ];

  const handlePhotoTaken = (photoData: string) => {
    setPhotos([...photos, photoData]);
    if (currentPose < poses.length - 1) {
      setCurrentPose(currentPose + 1);
    } else {
      // Here we'll eventually send photos to API for analysis
      console.log("Assessment complete!");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Pose {currentPose + 1} of {poses.length}</h2>
        <p className="text-lg">{poses[currentPose]}</p>
      </div>
      
      <Camera onPhotoTaken={handlePhotoTaken} />
      
      <div className="mt-4 text-center text-sm text-gray-600">
        {photos.length > 0 && (
          <p>{photos.length} of {poses.length} poses captured</p>
        )}
      </div>
    </div>
  );
}
