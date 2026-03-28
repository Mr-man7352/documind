import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "DocuMind — AI-Powered Document Chat";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        background: "#1d4ed8",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px",
      }}
    >
      <div
        style={{
          fontSize: 64,
          fontWeight: 700,
          color: "white",
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        DocuMind
      </div>
      <div
        style={{
          fontSize: 32,
          color: "#bfdbfe",
          textAlign: "center",
          marginTop: 24,
          maxWidth: 800,
        }}
      >
        Chat with your documents using AI
      </div>
      <div
        style={{
          marginTop: 48,
          background: "white",
          color: "#1d4ed8",
          fontSize: 24,
          fontWeight: 600,
          padding: "16px 40px",
          borderRadius: 12,
        }}
      >
        Get Started Free →
      </div>
    </div>,
    size,
  );
}
