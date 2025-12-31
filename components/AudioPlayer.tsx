
import React, { useState, useRef, useEffect } from 'react';

interface AudioPlayerProps {
  base64Data: string;
}

// Helper functions for decoding raw PCM data
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ base64Data }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (sourceNodeRef.current) sourceNodeRef.current.stop();
    };
  }, []);

  const initAudio = async () => {
    if (audioBufferRef.current) return audioBufferRef.current;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    const bytes = decodeBase64(base64Data);
    const buffer = await decodeAudioData(bytes, audioContextRef.current, 24000, 1);
    audioBufferRef.current = buffer;
    setDuration(buffer.duration);
    return buffer;
  };

  const updateProgress = () => {
    if (!audioContextRef.current || !isPlaying) return;
    
    const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
    const currentProgress = (elapsed / audioBufferRef.current!.duration) * 100;
    
    if (currentProgress >= 100) {
      setProgress(100);
      setIsPlaying(false);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    } else {
      setProgress(currentProgress);
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const togglePlay = async () => {
    if (isPlaying) {
      sourceNodeRef.current?.stop();
      setIsPlaying(false);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    try {
      const buffer = await initAudio();
      const ctx = audioContextRef.current!;
      
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      
      source.onended = () => {
        setIsPlaying(false);
        setProgress(100);
      };

      startTimeRef.current = ctx.currentTime;
      source.start(0);
      sourceNodeRef.current = source;
      setIsPlaying(true);
      setProgress(0);
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    } catch (err) {
      console.error("Playback failed", err);
    }
  };

  return (
    <div className="flex items-center space-x-3 bg-white/10 p-2 rounded-lg w-64">
      <button 
        onClick={togglePlay}
        className="w-10 h-10 flex items-center justify-center bg-rose-500 rounded-full text-white hover:bg-rose-600 transition-colors shrink-0"
      >
        {isPlaying ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        ) : (
          <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="h-1.5 bg-gray-300 rounded-full overflow-hidden">
          <div 
            className="h-full bg-rose-500 transition-all duration-75" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-gray-500 font-medium">
          <span>{duration > 0 ? (duration * (progress/100)).toFixed(1) : "0.0"}s</span>
          <span>Voice Note</span>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
