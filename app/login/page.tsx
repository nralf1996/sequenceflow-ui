"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";

const CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノ01011010110100101".split("");
const FONT_SIZE = 14;
const FPS = 20;

function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let drops: number[] = [];
    let rafId: number;
    let lastTime = 0;
    const interval = 1000 / FPS;

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const cols = Math.floor(canvas.width / FONT_SIZE);
      drops = Array.from({ length: cols }, () => Math.random() * -120);
    };

    const draw = () => {
      // Dark semi-transparent overlay creates the fading trail
      ctx.fillStyle = "rgba(11, 18, 32, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${FONT_SIZE}px "Courier New", monospace`;

      for (let i = 0; i < drops.length; i++) {
        if (drops[i] < 0) {
          drops[i] += 1;
          continue;
        }

        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x = i * FONT_SIZE;
        const y = drops[i] * FONT_SIZE;

        // Head character: bright lime
        ctx.fillStyle = "rgba(180, 240, 0, 0.92)";
        ctx.fillText(char, x, y);

        if (y > canvas.height && Math.random() > 0.974) {
          drops[i] = Math.random() * -80;
        } else {
          drops[i] += 1;
        }
      }
    };

    const loop = (timestamp: number) => {
      if (timestamp - lastTime >= interval) {
        draw();
        lastTime = timestamp;
      }
      rafId = requestAnimationFrame(loop);
    };

    init();
    window.addEventListener("resize", init);
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", init);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        opacity: 0.38,
        zIndex: 0,
      }}
    />
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function LoginPage() {
  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0B1220",
        padding: "24px",
        overflow: "hidden",
      }}
    >
      <MatrixRain />

      {/* Vignette: fades the rain toward the center so text stays readable */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(11,18,32,0.82) 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: "340px", textAlign: "center" }}>

        <h1
          style={{
            fontSize: "40px",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            color: "#E5E7EB",
            margin: "0 0 8px",
            lineHeight: 1,
          }}
        >
          SupportFlow
        </h1>

        <p
          style={{
            fontSize: "14px",
            color: "#4B5563",
            letterSpacing: "-0.01em",
            margin: "0 0 44px",
          }}
        >
          AI Support Operating System
        </p>

        <button
          onClick={handleGoogleLogin}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#F3F4F6"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFFFF"; }}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            padding: "13px 20px",
            borderRadius: "10px",
            border: "none",
            background: "#FFFFFF",
            color: "#111827",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "-0.01em",
            transition: "background 0.12s ease",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.06)",
          }}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <p
          style={{
            fontSize: "11px",
            color: "#374151",
            marginTop: "20px",
            letterSpacing: "0.01em",
          }}
        >
          Secure authentication via Google
        </p>

      </div>
    </div>
  );
}
