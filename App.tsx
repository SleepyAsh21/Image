
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Sparkles, Image as ImageIcon, Download, Send, RefreshCw, Layers, Zap } from 'lucide-react';

// --- Types ---
interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  aspectRatio: string;
}

interface ImageCardProps {
  image: GeneratedImage;
}

// --- Components ---

const Sidebar = ({ onSelectRatio, selectedRatio }: { onSelectRatio: (r: string) => void, selectedRatio: string }) => {
  const ratios = ['1:1', '3:4', '4:3', '16:9', '9:16'];
  return (
    <div className="hidden lg:flex flex-col w-64 h-screen sticky top-0 p-6 glass border-r border-white/10">
      <div className="flex items-center gap-2 mb-10">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Sparkles className="text-white w-6 h-6" />
        </div>
        <span className="text-xl font-bold tracking-tight">Lumina<span className="text-indigo-400">Canvas</span></span>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Aspect Ratio</h3>
          <div className="grid grid-cols-2 gap-3">
            {ratios.map((r) => (
              <button
                key={r}
                onClick={() => onSelectRatio(r)}
                className={`py-2 px-3 rounded-lg text-sm transition-all duration-200 border ${
                  selectedRatio === r 
                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' 
                  : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/20'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Quality Settings</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg glass border-white/5">
              <span className="text-sm text-gray-300">Fast Mode</span>
              <div className="w-10 h-5 bg-indigo-500 rounded-full relative">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg glass border-white/5 opacity-50 cursor-not-allowed">
              <span className="text-sm text-gray-300">HD Upscale</span>
              <div className="w-10 h-5 bg-gray-700 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-white/5">
        <p className="text-[10px] text-gray-600 leading-relaxed uppercase tracking-tighter">
          Powered by Gemini 2.5 Flash
        </p>
      </div>
    </div>
  );
};

// Fixed ImageCard to correctly handle props including the React key attribute
const ImageCard = ({ image }: ImageCardProps) => {
  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `lumina-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="group relative rounded-2xl overflow-hidden glass border-white/10 hover:border-indigo-500/50 transition-all duration-500 transform hover:-translate-y-1">
      <img src={image.url} alt={image.prompt} className="w-full h-auto object-cover aspect-square sm:aspect-auto" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
        <p className="text-xs text-white/90 line-clamp-2 mb-3 italic">"{image.prompt}"</p>
        <div className="flex gap-2">
          <button 
            onClick={downloadImage}
            className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Download size={14} /> Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [error, setError] = useState<string | null>(null);

  const generateImage = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);

    try {
      // Create a new GoogleGenAI instance right before making an API call
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
          },
        },
      });

      let imageUrl = '';
      const candidates = response.candidates || [];
      const parts = candidates[0]?.content?.parts || [];
      
      for (const part of parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        const newImage: GeneratedImage = {
          id: Math.random().toString(36).substring(2, 11),
          url: imageUrl,
          prompt,
          timestamp: Date.now(),
          aspectRatio,
        };
        setImages(prev => [newImage, ...prev]);
        setPrompt('');
      } else {
        throw new Error("No image data returned from model.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30">
      <Sidebar selectedRatio={aspectRatio} onSelectRatio={setAspectRatio} />
      
      <main className="flex-1 flex flex-col p-4 md:p-8 lg:p-12 max-w-7xl mx-auto w-full">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
              Create <span className="gradient-text">Masterpieces</span>
            </h1>
            <p className="text-gray-400 text-sm md:text-base">Turn your words into stunning visual art in seconds.</p>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <img 
                  key={i} 
                  src={`https://picsum.photos/seed/${i + 40}/32/32`} 
                  className="w-8 h-8 rounded-full border-2 border-[#050505]" 
                  alt="User"
                />
              ))}
            </div>
            <span className="text-xs font-medium text-gray-500">Joined by 12k+ artists</span>
          </div>
        </header>

        {/* Search Bar Area */}
        <div className="relative mb-16">
          <div className="glass rounded-3xl p-2 flex items-center shadow-2xl shadow-indigo-500/5 group focus-within:border-indigo-500/50 transition-all duration-300">
            <div className="pl-4 text-indigo-400">
              <Zap size={20} />
            </div>
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generateImage()}
              placeholder="A futuristic cyber-city floating in a cosmic nebula..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-gray-600 px-4 py-3 md:py-5 text-sm md:text-lg"
              disabled={isGenerating}
            />
            <button 
              onClick={generateImage}
              disabled={isGenerating || !prompt.trim()}
              className={`flex items-center gap-2 px-6 py-3 md:py-4 rounded-2xl font-semibold text-sm md:text-base transition-all duration-300 ${
                isGenerating || !prompt.trim() 
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/40 active:scale-95'
              }`}
            >
              {isGenerating ? (
                <RefreshCw className="animate-spin" size={20} />
              ) : (
                <>Generate <Send size={18} /></>
              )}
            </button>
          </div>
          {error && (
            <p className="absolute -bottom-8 left-4 text-rose-500 text-xs font-medium bg-rose-500/10 px-3 py-1 rounded-full animate-bounce">
              {error}
            </p>
          )}
        </div>

        {/* Gallery Section */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-8">
            <Layers size={20} className="text-indigo-400" />
            <h2 className="text-xl font-bold">Your Creations</h2>
            <div className="h-px flex-1 bg-white/5 ml-4"></div>
          </div>

          {images.length === 0 && !isGenerating ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center mb-6">
                <ImageIcon size={32} className="text-gray-500" />
              </div>
              <p className="text-gray-400 max-w-xs">Nothing here yet. Describe something beautiful above to start your gallery.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {isGenerating && (
                <div className="relative rounded-2xl overflow-hidden glass border-white/10 flex flex-col items-center justify-center aspect-square shimmer">
                   <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                      <p className="text-sm font-medium text-indigo-300 animate-pulse">Dreaming up your vision...</p>
                   </div>
                </div>
              )}
              {images.map(img => (
                <ImageCard key={img.id} image={img} />
              ))}
            </div>
          )}
        </div>

        {/* Mobile Navigation/Controls */}
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 glass px-4 py-2 rounded-full border-white/20 shadow-2xl z-50">
          <span className="text-xs text-gray-400 mr-2">Ratio:</span>
          {['1:1', '16:9', '9:16'].map(r => (
            <button
              key={r}
              onClick={() => setAspectRatio(r)}
              className={`text-[10px] font-bold px-3 py-1 rounded-full transition-colors ${
                aspectRatio === r ? 'bg-indigo-500 text-white' : 'text-gray-400'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
