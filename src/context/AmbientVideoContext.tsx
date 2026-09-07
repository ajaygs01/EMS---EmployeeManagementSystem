import React, { createContext, useContext, useState, useEffect } from "react";

export const AMBIENT_VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_084718_72a17915-4964-4059-afcd-22d59399b72e.mp4";

interface AmbientVideoContextType {
  isVideoActive: boolean;
  setIsVideoActive: (active: boolean) => void;
  toggleVideo: () => void;
  videoOpacity: number;
  setVideoOpacity: (opacity: number) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  toggleMute: () => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
}

const AmbientVideoContext = createContext<AmbientVideoContextType | undefined>(undefined);

export const AmbientVideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVideoActive, setIsVideoActive] = useState<boolean>(() => {
    const saved = localStorage.getItem("ems_ambient_video_active");
    return saved !== null ? saved === "true" : true;
  });

  const [videoOpacity, setVideoOpacity] = useState<number>(() => {
    const saved = localStorage.getItem("ems_ambient_video_opacity");
    if (saved !== null) {
      const val = parseFloat(saved);
      if (val < 0.7) return 0.9;
      return val;
    }
    return 0.9;
  });

  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  useEffect(() => {
    localStorage.setItem("ems_ambient_video_active", String(isVideoActive));
  }, [isVideoActive]);

  useEffect(() => {
    localStorage.setItem("ems_ambient_video_opacity", String(videoOpacity));
  }, [videoOpacity]);

  const toggleVideo = () => setIsVideoActive((prev) => !prev);
  const toggleMute = () => setIsMuted((prev) => !prev);

  return (
    <AmbientVideoContext.Provider
      value={{
        isVideoActive,
        setIsVideoActive,
        toggleVideo,
        videoOpacity,
        setVideoOpacity,
        isMuted,
        setIsMuted,
        toggleMute,
        playbackSpeed,
        setPlaybackSpeed,
      }}
    >
      {children}
    </AmbientVideoContext.Provider>
  );
};

export const useAmbientVideo = () => {
  const ctx = useContext(AmbientVideoContext);
  if (!ctx) {
    throw new Error("useAmbientVideo must be used within an AmbientVideoProvider");
  }
  return ctx;
};
