"use client";

import { createClient } from "@/lib/supabaseClient";

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
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
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#F9FAFB",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "340px", textAlign: "center" }}>

        {/* Wordmark */}
        <h1
          style={{
            fontSize: "40px",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            color: "#0B1220",
            margin: "0 0 8px",
            lineHeight: 1,
          }}
        >
          Support<span style={{ color: "#B4F000" }}>Flow</span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "14px",
            color: "#9CA3AF",
            letterSpacing: "-0.01em",
            margin: "0 0 40px",
          }}
        >
          AI Support Operating System
        </p>

        {/* Google button */}
        <button
          onClick={handleGoogleLogin}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#1F2937"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#0B1220"; }}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            padding: "13px 20px",
            borderRadius: "10px",
            border: "none",
            background: "#0B1220",
            color: "#F9FAFB",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "-0.01em",
            transition: "background 0.12s ease",
          }}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {/* Footer */}
        <p
          style={{
            fontSize: "11px",
            color: "#D1D5DB",
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
