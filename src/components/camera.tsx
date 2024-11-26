import { useRef, useState } from 'react';

interface CameraProps {
  onPhotoTaken: (photoData: string) => void;
}

const Camera = ({ onPhotoTaken }: CameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Unable to access camera. Please ensure you've granted camera permissions.");
    }
  };

  const takePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(videoRef.current, 0, 0);
      const photoData = canvas.toDataURL('image/jpeg');
      onPhotoTaken(photoData);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {!isStreaming ? (
        <button
          onClick={startCamera}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Start Camera
        </button>
      ) : (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="max-w-full h-auto"
          />
          <button
            onClick={takePhoto}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 
                     bg-white text-blue-500 px-4 py-2 rounded-full shadow"
          >
            Take Photo
          </button>
        </div>
      )}
    </div>
  );
};

export default Camera;
