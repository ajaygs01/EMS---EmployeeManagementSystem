import React, { useRef, useEffect, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Sliders, Eye, EyeOff } from "lucide-react";
import { useAmbientVideo, AMBIENT_VIDEO_URL } from "../context/AmbientVideoContext";

interface AmbientVideoBackgroundProps {
  className?: string;
  showControls?: boolean;
  controlsPosition?: "bottom-right" | "bottom-left" | "top-right";
  overlayClassName?: string;
}

export const AmbientVideoBackground: React.FC<AmbientVideoBackgroundProps> = ({
  className = "",
  showControls = false,
  controlsPosition = "bottom-right",
  overlayClassName = "",
}) => {
  const {
    isVideoActive,
    toggleVideo,
    videoOpacity,
    setVideoOpacity,
    isMuted,
    toggleMute,
    playbackSpeed,
  } = useAmbientVideo();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Mount auto-play reassurance
  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.defaultMuted = true;
    videoRef.current.muted = true;
    videoRef.current.playsInline = true;
    const playPromise = videoRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
          }
        });
    }
  }, []);

  // Synchronize play/pause with isVideoActive
  useEffect(() => {
    if (!videoRef.current) return;
    if (isVideoActive) {
      videoRef.current.muted = isMuted;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
            }
          });
      }
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isVideoActive, isMuted]);

  // Synchronize mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Synchronize playback rate
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const handleManualPlayToggle = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const getPositionClasses = () => {
    switch (controlsPosition) {
      case "bottom-left":
        return "bottom-4 left-4";
      case "top-right":
        return "top-20 right-4";
      case "bottom-right":
      default:
        return "bottom-5 right-5";
    }
  };

  return (
    <div
      id="ambient-video-container"
      className={`fixed inset-0 z-0 overflow-hidden pointer-events-none transition-opacity duration-700 ${className}`}
      style={{ opacity: isVideoActive ? 1 : 0 }}
      aria-hidden="true"
    >
      {/* Background Video Element */}
      <video
        ref={videoRef}
        src={AMBIENT_VIDEO_URL}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        preload="auto"
        onLoadedData={() => setIsLoaded(true)}
        onCanPlay={() => setIsLoaded(true)}
        onPlaying={() => setIsPlaying(true)}
        className="absolute inset-0 w-full h-full object-cover object-center transform-gpu transition-opacity duration-700"
        style={{
          opacity: isVideoActive ? videoOpacity : 0,
        }}
      />

      {/* Subtle translucent contrast veil so text remains sharp while video is clearly visible */}
      <div
        className={`absolute inset-0 transition-colors duration-500 pointer-events-none ${
          overlayClassName ||
          "bg-black/25 dark:bg-black/45"
        }`}
      />

      {/* Dynamic ambient soft accent glows */}
      <div className="absolute inset-0 bg-radial-[at_top_right] from-orange-500/15 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-radial-[at_bottom_left] from-amber-500/15 via-transparent to-transparent pointer-events-none" />

      {/* Interactive Controls Dock */}
      {showControls && (
        <div
          className={`absolute ${getPositionClasses()} z-50 pointer-events-auto flex flex-col items-end gap-2`}
        >
          {/* Expanded Settings Menu */}
          {showSettings && (
            <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-2xl shadow-xl w-60 text-xs flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-orange-500" />
                  Ambient Video Settings
                </span>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  ✕
                </button>
              </div>

              {/* Opacity Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px] text-zinc-500">
                  <span>Intensity</span>
                  <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                    {Math.round(videoOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.15"
                  max="0.95"
                  step="0.05"
                  value={videoOpacity}
                  onChange={(e) => setVideoOpacity(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60 dark:border-zinc-800/60 text-[11px]">
                <button
                  onClick={toggleMute}
                  className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 hover:text-orange-500 font-medium cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-orange-500" />}
                  <span>{isMuted ? "Unmute" : "Mute"}</span>
                </button>
                <button
                  onClick={toggleVideo}
                  className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 hover:text-orange-500 font-medium cursor-pointer"
                >
                  {isVideoActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-orange-500" />}
                  <span>{isVideoActive ? "Hide Video" : "Show Video"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Floating Pill Dock Button */}
          <div className="flex items-center gap-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-1.5 rounded-full shadow-lg">
            <button
              onClick={handleManualPlayToggle}
              className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              title={isPlaying ? "Pause Ambient Motion" : "Play Ambient Motion"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-orange-500" /> : <Play className="w-3.5 h-3.5 text-zinc-500" />}
            </button>

            <div className="w-px h-3.5 bg-zinc-200 dark:bg-zinc-800" />

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              title="Ambient Video Controls"
            >
              <Sliders className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 hover:text-orange-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
