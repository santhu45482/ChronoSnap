import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CameraProps {
  onCapture: (imageSrc: string) => void;
}

export const Camera: React.FC<CameraProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError('');
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Match canvas size to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Flip horizontally for mirror effect if needed, but for processing we want true image
        // We'll capture raw.
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageSrc = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(imageSrc);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onCapture(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-4 animate-fadeIn">
      <div className="relative w-full aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border-2 border-neon-blue/30 group">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-red-400 p-4 text-center">
            {error}
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect for user view
          />
        )}
        
        {/* Overlay guides */}
        <div className="absolute inset-0 pointer-events-none border-[20px] border-transparent">
          <div className="w-full h-full border-2 border-white/20 rounded-lg relative">
             <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-neon-blue rounded-tl-lg"></div>
             <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-neon-blue rounded-tr-lg"></div>
             <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-neon-blue rounded-bl-lg"></div>
             <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-neon-blue rounded-br-lg"></div>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex gap-4 mt-8 w-full justify-center">
        <label className="flex items-center justify-center px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-full cursor-pointer transition-all border border-gray-600">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
          Upload
          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </label>
        
        <button
          onClick={handleCapture}
          className="group relative flex items-center justify-center p-1 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple hover:scale-105 transition-transform"
        >
          <div className="bg-white text-black font-bold py-3 px-8 rounded-full flex items-center gap-2 group-hover:bg-opacity-90 transition-all">
             <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
             SNAP PHOTO
          </div>
        </button>
      </div>
      <p className="mt-4 text-gray-400 text-sm">Or tap 'Upload' to use an existing photo</p>
    </div>
  );
};
