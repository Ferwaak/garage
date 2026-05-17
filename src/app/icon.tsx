import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
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
            width: 24,
            height: 21,
            display: "flex",
            background: "#ffffff",
            borderRadius: 3,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 3,
              top: -7,
              width: 18,
              height: 18,
              background: "#ffffff",
              transform: "rotate(45deg)",
              borderRadius: 2,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 5,
              bottom: 0,
              width: 14,
              height: 11,
              background: "#d7a31b",
              borderRadius: "3px 3px 0 0",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 8,
              bottom: 3,
              width: 8,
              height: 2,
              background: "#094d42",
            }}
          />
        </div>
      </div>
    ),
    size
  );
}
