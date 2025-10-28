"use client";
import HomePage from "@/Components/HomePage";
import Membership from "@/Components/Membership";
import React from "react";
import ContactUs from "@/Components/ContactUs";

export default function Home() {
  // use the public video URL (place the file at public/videos/bg.mp4)
  const VIDEO_SRC = "/videos/bg.mp4";

  return (
    <div>
      {/* Fullscreen background video (muted, autoplay, loop, no controls) */}
      <video
        aria-hidden="true"
        src={VIDEO_SRC}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          objectFit: "cover",
          zIndex: 0,
          border: 0,
          pointerEvents: "none", // allow interactions with overlay
        }}
      />

      {/* Overlay content above the video */}
      <div style={{ position: "relative", zIndex: 10 }}>
        <HomePage />
        <Membership />
        <ContactUs />
      </div>
    </div>
  );
}
