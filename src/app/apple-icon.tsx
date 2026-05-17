import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#094d42",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 122,
            height: 104,
            display: "flex",
            background: "#ffffff",
            borderRadius: 16,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 20,
              top: -38,
              width: 84,
              height: 84,
              background: "#ffffff",
              transform: "rotate(45deg)",
              borderRadius: 10,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 27,
              bottom: 0,
              width: 68,
              height: 58,
              background: "#d7a31b",
              borderRadius: "14px 14px 0 0",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 42,
              bottom: 18,
              width: 38,
              height: 9,
              background: "#094d42",
              borderRadius: 8,
            }}
          />
        </div>
      </div>
    ),
    size
  );
}
