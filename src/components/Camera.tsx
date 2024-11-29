// src/components/Camera.tsx

import { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Upload, Timer } from 'lucide-react';

interface CameraProps {
  onPhotoTaken: (photoData: string) => void;
  currentPhoto: string | null;
  retryMessage?: string | null;
}

const CameraComponent = ({ onPhotoTaken, currentPhoto, retryMessage }: CameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [uploadMode, setUploadMode] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facingMode
        } 
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please ensure you've granted camera permissions.");
    }
  };

  useEffect(() => {
    if (!uploadMode && !currentPhoto && !previewPhoto) {
      startCamera();
    }
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [facingMode, uploadMode, currentPhoto, previewPhoto]);

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
      setPreviewPhoto(photoData);

      const tracks = (videoRef.current.srcObject as MediaStream)?.getTracks();
      tracks?.forEach(track => track.stop());
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const photoData = e.target?.result as string;
        setPreviewPhoto(photoData);
      };
      reader.onerror = () => {
        setError('Error reading file');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRetry = () => {
    setError(null);
    setPreviewPhoto(null);
    if (!uploadMode) {
      startCamera();
    }
  };

  const toggleMode = () => {
    setUploadMode(!uploadMode);
    setError(null);
    setPreviewPhoto(null);
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  if (error || retryMessage) {
    return (
      <div className="text-center p-6 bg-purple-900/30 rounded-xl backdrop-blur-sm border border-purple-300/20">
        <p className="text-purple-100 mb-6">{retryMessage || error}</p>
        {currentPhoto && (
          <div className="mb-6 max-w-md mx-auto">
            <img 
              src={currentPhoto} 
              alt="Previous attempt" 
              className="w-full h-auto rounded-lg border border-purple-300/20"
            />
          </div>
        )}
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleRetry}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 
                     transition-all duration-300 shadow-lg shadow-purple-900/50
                     flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <button
            onClick={toggleMode}
            className="px-6 py-2 bg-purple-900/30 text-purple-100 rounded-lg
                     hover:bg-purple-800/30 transition-all duration-300
                     border border-purple-300/20 flex items-center space-x-2"
          >
            {uploadMode ? (
              <>
                <Camera className="w-4 h-4" />
                <span>Switch to Camera</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Switch to Upload</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold text-white mb-2">
          {uploadMode ? 'Upload Your Pose' : 'Capture Your Pose'}
        </h2>
        <p className="text-purple-200 text-sm">
          Ensure your full body is visible
        </p>
      </div>

      <div className="relative bg-purple-900/20 backdrop-blur-sm
                    border border-purple-300/20 shadow-xl rounded-2xl overflow-hidden">
        {previewPhoto ? (
          <div className="relative max-h-[70vh] overflow-hidden">
            <img 
              src={previewPhoto} 
              alt="Preview" 
              className="w-full h-auto object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent">
              <div className="p-4 w-full flex justify-center space-x-4">
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg
                           hover:bg-white/20 transition-colors border border-white/20
                           flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retake</span>
                </button>
                <button
                  onClick={() => onPhotoTaken(previewPhoto)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg
                           hover:bg-purple-500 transition-colors
                           flex items-center space-x-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Use Photo</span>
                </button>
              </div>
            </div>
          </div>
        ) : uploadMode ? (
          <div className="aspect-auto p-8 flex flex-col items-center justify-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center space-y-4 p-8 text-purple-200 
                       hover:text-white transition-colors"
            >
              <Upload className="w-8 h-8" />
              <span>Click to upload a photo</span>
            </button>
          </div>
        ) : (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`w-full h-auto object-contain max-h-[70vh] ${
                facingMode === 'user' ? 'scale-x-[-1]' : ''
              }`}
              onLoadedMetadata={() => setIsStreaming(true)}
            />
            {isStreaming && !isCountingDown && (
              <div className="absolute inset-0 flex flex-col items-center justify-end
                           bg-gradient-to-t from-black/70 to-transparent">
                <div className="w-full p-4 space-y-4">
                  <div className="flex justify-center items-center space-x-4">
                    <button
                      onClick={handleToggleCamera}
                      className="p-4 bg-white/10 backdrop-blur-sm text-white rounded-full
                               hover:bg-white/20 transition-all duration-300 
                               shadow-lg border border-white/20"
                      title="Switch Camera"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleStartCountdown}
                      className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-full
                               hover:bg-white/20 transition-all duration-300
                               shadow-lg border border-white/20
                               font-medium text-lg flex items-center space-x-2"
                    >
                      <Timer className="w-5 h-5" />
                      <span>Take Photo</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isCountingDown && (
              <div className="absolute inset-0 flex items-center justify-center 
                           bg-black/40 backdrop-blur-sm">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping opacity-50">
                    <div className="w-24 h-24 rounded-full bg-white/20"></div>
                  </div>
                  <div className="text-white text-6xl font-bold relative z-10">
                    {countdown}
                  </div>
                </div>
              </div>
            )}

            {!isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center 
                           bg-purple-900/80 backdrop-blur-sm">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-12 h-12 border-4 border-purple-200 border-t-transparent
                               rounded-full animate-spin"></div>
                  <p className="text-purple-200 text-lg">Starting camera...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={toggleMode}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-900/30 
                   text-purple-200 rounded-lg hover:bg-purple-800/30 transition-colors"
        >
          {uploadMode ? (
            <>
              <Camera className="w-4 h-4" />
              <span>Switch to Camera</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Switch to Upload</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-6 p-4 bg-purple-900/20 backdrop-blur-sm rounded-xl
                    border border-purple-300/20">
        <h3 className="text-white font-medium mb-2">Tips for Best Results:</h3>
        <ul className="text-purple-200 text-sm space-y-2">
          <li className="flex items-center">
            <span className="mr-2">•</span>
            Use portrait orientation for your photo
          </li>
          <li className="flex items-center">
            <span className="mr-2">•</span>
            Ensure your entire body is visible
          </li>
          <li className="flex items-center">
            <span className="mr-2">•</span>
            Find a well-lit area
          </li>
          <li className="flex items-center">
            <span className="mr-2">•</span>
            Use a clear background
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CameraComponent;
