// src/components/CameraComponent.tsx

import { useRef, useState, useEffect } from 'react';

interface CameraProps {
  onPhotoTaken: (photoData: string) => void;
}

const CameraComponent = ({ onPhotoTaken }: CameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  // Add file upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5000000) { // 5MB limit
      setError('File size too large. Please choose an image under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const photoData = e.target?.result as string;
      onPhotoTaken(photoData);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
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

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    
    if (isCountingDown && countdown > 0) {
      intervalId = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      handleTakePhoto();
      setIsCountingDown(false);
      setCountdown(5);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isCountingDown, countdown]);

  const handleToggleCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleStartCountdown = () => {
    setIsCountingDown(true);
  };

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

      const tracks = (videoRef.current.srcObject as MediaStream)?.getTracks();
      tracks?.forEach(track => track.stop());
    }
  };

  if (error) {
    return (
      <div className="text-center p-6 bg-purple-900/30 rounded-xl backdrop-blur-sm border border-purple-300/20">
        <p className="text-purple-100 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null);
            startCamera();
          }}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 
          transition-all duration-300 shadow-lg shadow-purple-900/50"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto px-4">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold text-white mb-2">Capture Your Pose</h2>
        <p className="text-purple-200 text-sm">Take a photo or upload one from your device</p>
      </div>

      {/* Add file upload button */}
      <div className="mb-4 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-lg
          hover:bg-white/20 transition-all duration-300
          shadow-lg border border-white/20 mb-4"
        >
          Upload Photo
        </button>
      </div>

      <div className="text-center mb-4">
        <span className="text-purple-200 text-sm">- or -</span>
      </div>

      <div className="relative rounded-2xl overflow-hidden bg-purple-900/20 backdrop-blur-sm
      border border-purple-300/20 shadow-xl">
        <div className="relative aspect-[3/4] md:aspect-[4/3] w-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`absolute inset-0 w-full h-full object-cover ${
              facingMode === 'user' ? 'scale-x-[-1]' : ''
            }`}
            onLoadedMetadata={() => setIsStreaming(true)}
          />
          
          {isStreaming && !isCountingDown && (
            <div className="absolute inset-0 flex flex-col items-center justify-end
            bg-gradient-to-t from-black/70 via-transparent to-transparent">
              <div className="w-full p-4 space-y-4">
                <div className="flex justify-center items-center space-x-4">
                  <button
                    onClick={handleToggleCamera}
                    className="p-4 bg-white/10
