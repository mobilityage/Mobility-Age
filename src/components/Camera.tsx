// src/components/Camera.tsx

import { useRef, useState, useEffect } from 'react';

interface CameraProps {
  onPhotoTaken: (photoData: string) => void;
  currentPhoto: string | null;
}

const CameraComponent = ({ onPhotoTaken, currentPhoto }: CameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          aspectRatio: { ideal: 16 / 9 } // Ensure a wider aspect ratio
        } 
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please ensure you've granted camera permissions.");
    }
  };

  // Existing useEffect and other functions...

  const handleTakePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const context = canvas.getContext('2d');
    if (context) {
      if (facingMode === 'user') {
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
      }
      context.drawImage(videoRef.current, 0, 0);
      const photoData = canvas.toDataURL('image/jpeg', 0.8);
      onPhotoTaken(photoData);
    }
  };

  // Existing JSX rendering...

  return (
    <div className="w-full max-w-lg mx-auto px-4">
      {/* Camera UI */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        onLoadedMetadata={() => setIsStreaming(true)}
      />
      {/* Other UI elements... */}
    </div>
  );
};

export default CameraComponent;
