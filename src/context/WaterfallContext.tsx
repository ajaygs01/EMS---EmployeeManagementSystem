import React from "react";
import { AmbientVideoProvider, useAmbientVideo, AMBIENT_VIDEO_URL } from "./AmbientVideoContext";

// Backward-compatibility wrapper for any components referencing WaterfallProvider/useWaterfall
export { AmbientVideoProvider as WaterfallProvider };
export const useWaterfall = () => {
  const videoCtx = useAmbientVideo();
  return {
    ...videoCtx,
    isGenoActive: videoCtx.isVideoActive,
    toggleGenoTrace: videoCtx.toggleVideo,
    isActive: videoCtx.isVideoActive,
    toggleWaterfall: videoCtx.toggleVideo,
  };
};

export { AMBIENT_VIDEO_URL };
