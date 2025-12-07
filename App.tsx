import React, { useState, useCallback } from 'react';
import { Camera } from './components/Camera';
import { LoadingScreen } from './components/LoadingScreen';
import { analyzeImage, generateTimeTravelImage } from './services/geminiService';
import { ERAS } from './constants';
import { AppState, Era, AnalysisResult } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('capture');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedEraId, setSelectedEraId] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleCapture = async (imageSrc: string) => {
    setCapturedImage(imageSrc);
    setState('analyze');
    
    // Auto-trigger analysis
    try {
      const result = await analyzeImage(imageSrc);
      setAnalysis(result);
      setState('select-era');
    } catch (err) {
      console.error(err);
      // If analysis fails, just go to selection
      setState('select-era');
    }
  };

  const handleEraSelect = (era: Era) => {
    setSelectedEraId(era.id);
    setCustomPrompt(''); // clear custom if preset selected
    handleGenerate(era.promptModifier);
  };

  const handleCustomGenerate = () => {
    if (!customPrompt.trim()) return;
    handleGenerate(customPrompt);
  };

  const handleGenerate = async (prompt: string) => {
    if (!capturedImage) return;
    setState('processing');
    setError(null);

    try {
      const resultImage = await generateTimeTravelImage(capturedImage, prompt);
      setGeneratedImage(resultImage);
      setState('result');
    } catch (err: any) {
      console.error(err);
      // Display the actual error message if possible
      setError(err.message || "Time travel malfunction! The portal closed unexpectedly. Please try again.");
      setState('select-era');
    }
  };

  const reset = () => {
    setCapturedImage(null);
    setGeneratedImage(null);
    setAnalysis(null);
    setSelectedEraId(null);
    setCustomPrompt('');
    setState('capture');
  };

  const downloadImage = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `chronosnap-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = async () => {
    if (!generatedImage) return;

    try {
      // Convert base64 to blob
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const file = new File([blob], 'chronosnap-result.png', { type: 'image/png' });
      
      const shareData = {
        title: 'ChronoSnap Time Travel',
        text: 'Just returned from a trip through time! 🕰️✨ #ChronoSnap #GeminiAI',
        files: [file],
      };

      // Check for Web Share API support
      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy to clipboard
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob
            })
          ]);
          alert('Image copied to clipboard! You can paste it into your favorite social media app.');
        } catch (clipErr) {
          console.error('Clipboard failed', clipErr);
          alert('Sharing is not supported on this browser. Please download the image to share it.');
        }
      }
    } catch (err) {
      console.error('Error sharing:', err);
      alert('Failed to prepare image for sharing.');
    }
  };

  return (
    <div className="min-h-screen bg-deep-space text-white pb-20">
      {/* Header */}
      <header className="p-6 border-b border-white/10 sticky top-0 bg-deep-space/90 backdrop-blur-md z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🕰️</span>
            <h1 className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-purple">
              ChronoSnap
            </h1>
          </div>
          {state !== 'capture' && (
            <button 
              onClick={reset}
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Start Over
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-200 flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            {error}
          </div>
        )}

        {/* STEP 1: CAPTURE */}
        {state === 'capture' && (
          <div className="space-y-6 text-center animate-fadeIn">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Where will you go <span className="text-neon-blue">today?</span>
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto mb-8">
              Take a selfie to begin your journey through time using Gemini AI.
            </p>
            <Camera onCapture={handleCapture} />
          </div>
        )}

        {/* STEP 2: ANALYZE (Loader) */}
        {state === 'analyze' && (
          <LoadingScreen message="Analyzing your temporal signature..." />
        )}

        {/* STEP 3: SELECT ERA */}
        {state === 'select-era' && (
          <div className="animate-fadeIn">
            <div className="flex flex-col md:flex-row gap-8 mb-8 items-start">
              {/* Captured Preview */}
              <div className="w-full md:w-1/3 flex flex-col gap-4">
                <div className="relative rounded-2xl overflow-hidden border-2 border-white/10 shadow-xl aspect-square bg-gray-900">
                  {capturedImage && (
                    <img src={capturedImage} alt="You" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 p-3 backdrop-blur-sm">
                     <p className="text-xs text-gray-300 font-mono">SUBJECT_ID: TEMPORAL_TRAVELER</p>
                  </div>
                </div>
                
                {analysis && (
                  <div className="bg-gray-900/50 p-4 rounded-xl border border-white/5">
                    <h3 className="text-neon-blue font-bold mb-2 text-sm uppercase tracking-wider">AI Analysis</h3>
                    <p className="text-gray-300 text-sm italic">"{analysis.description}"</p>
                    
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-2">SUGGESTED DESTINATIONS:</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.suggestedEras.map((s, i) => (
                          <span key={i} className="text-xs bg-white/10 px-2 py-1 rounded text-neon-purple border border-neon-purple/30">
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Era Selection */}
              <div className="w-full md:w-2/3">
                <h2 className="text-2xl font-bold mb-6">Select Destination</h2>
                
                {/* Custom Prompt Input */}
                <div className="mb-8 bg-gray-900 p-4 rounded-xl border border-neon-blue/20 focus-within:border-neon-blue transition-colors">
                    <label className="block text-sm text-gray-400 mb-2">Custom Destination</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="e.g., A disco dancer in the 1970s..." 
                            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-600"
                        />
                        <button 
                            onClick={handleCustomGenerate}
                            disabled={!customPrompt.trim()}
                            className="bg-neon-blue text-black px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-50 hover:bg-white transition-colors"
                        >
                            GO
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {ERAS.map((era) => (
                    <button
                      key={era.id}
                      onClick={() => handleEraSelect(era)}
                      className="group relative h-48 md:h-64 rounded-xl overflow-hidden hover:ring-2 hover:ring-neon-purple transition-all text-left flex flex-col justify-end shadow-lg"
                    >
                      {/* Background Image */}
                      <img 
                        src={era.previewImage} 
                        alt={era.name} 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-100"
                      />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-90 group-hover:opacity-70 transition-opacity duration-300" />

                      {/* Content */}
                      <div className="relative z-10 p-4 transform transition-transform duration-300 translate-y-2 group-hover:translate-y-0">
                        <span className="text-3xl mb-1 block drop-shadow-md">{era.icon}</span>
                        <h3 className="font-bold text-white group-hover:text-neon-blue transition-colors drop-shadow-md leading-tight">
                          {era.name}
                        </h3>
                        <p className="text-xs text-gray-300 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75 line-clamp-2 drop-shadow-sm">
                          {era.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: PROCESSING */}
        {state === 'processing' && (
          <LoadingScreen message="Generating Reality..." />
        )}

        {/* STEP 5: RESULT */}
        {state === 'result' && (
          <div className="animate-fadeIn max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Arrival Successful</h2>
            
            <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl border border-white/20 mb-8 mx-auto max-w-2xl">
              {generatedImage && (
                <img src={generatedImage} alt="Time Travel Result" className="w-full h-auto" />
              )}
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]"></div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
               <button
                onClick={() => setState('select-era')}
                className="px-6 py-3 rounded-full border border-gray-600 hover:bg-gray-800 transition-colors order-2 md:order-1"
               >
                 Try Another Era
               </button>
               <button
                onClick={downloadImage}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple text-black font-bold hover:scale-105 transition-transform shadow-lg shadow-neon-blue/20 order-1 md:order-2 w-full md:w-auto"
               >
                 Download Souvenir
               </button>
               <button
                onClick={handleShare}
                className="px-6 py-3 rounded-full bg-gray-800 text-white font-bold hover:bg-gray-700 transition-colors border border-gray-600 flex items-center justify-center gap-2 order-3"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                 Share
               </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;