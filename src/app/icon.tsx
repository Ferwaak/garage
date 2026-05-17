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
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#070a09",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "radial-gradient(circle at 50% 68%, rgba(11,86,74,0.38), transparent 44%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 6,
            top: 10,
            width: 2,
            height: 14,
            display: "flex",
            background: "#cfd2cd",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 6,
            top: 10,
            width: 2,
            height: 14,
            display: "flex",
            background: "#cfd2cd",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 7,
            top: 8,
            width: 12,
            height: 2,
            display: "flex",
            background: "#e6e8e3",
            transform: "rotate(-31deg)",
            transformOrigin: "left center",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 7,
            top: 8,
            width: 12,
            height: 2,
            display: "flex",
            background: "#a6aaa5",
            transform: "rotate(31deg)",
            transformOrigin: "right center",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 9,
            top: 13,
            width: 14,
            height: 11,
            display: "flex",
            border: "1px solid #0b564a",
            borderBottom: "0",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 10,
            top: 16,
            width: 12,
            height: 1,
            display: "flex",
            background: "rgba(111,255,238,0.42)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 8,
            bottom: 7,
            width: 16,
            height: 6,
            display: "flex",
            border: "1px solid #8b918d",
            borderRadius: 2,
            background: "linear-gradient(180deg,#1c201e,#030504)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 11,
            bottom: 13,
            width: 10,
            height: 4,
            display: "flex",
            border: "1px solid #8b918d",
            background: "#010202",
            transform: "skewX(-8deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 9,
            bottom: 11,
            width: 5,
            height: 2,
            display: "flex",
            background: "#6fffee",
            transform: "rotate(13deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 9,
            bottom: 11,
            width: 5,
            height: 2,
            display: "flex",
            background: "#6fffee",
            transform: "rotate(-13deg)",
          }}
        />
      </div>
    ),
    size
  );
}
