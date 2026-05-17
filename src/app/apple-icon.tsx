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
              "radial-gradient(circle at 50% 68%, rgba(11,86,74,0.34), transparent 46%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 32,
            top: 58,
            width: 10,
            height: 75,
            display: "flex",
            background: "linear-gradient(180deg,#eef0ec,#777d78)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 32,
            top: 58,
            width: 10,
            height: 75,
            display: "flex",
            background: "linear-gradient(180deg,#eef0ec,#777d78)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 37,
            top: 48,
            width: 68,
            height: 9,
            display: "flex",
            background: "linear-gradient(90deg,#eef0ec,#777d78)",
            transform: "rotate(-31deg)",
            transformOrigin: "left center",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 37,
            top: 48,
            width: 68,
            height: 9,
            display: "flex",
            background: "linear-gradient(90deg,#777d78,#eef0ec)",
            transform: "rotate(31deg)",
            transformOrigin: "right center",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 48,
            top: 73,
            width: 84,
            height: 65,
            display: "flex",
            border: "5px solid #0b564a",
            borderBottom: "0",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 55,
            top: 90,
            width: 70,
            height: 3,
            display: "flex",
            background: "rgba(111,255,238,0.42)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 48,
            bottom: 44,
            width: 84,
            height: 32,
            display: "flex",
            border: "4px solid #8b918d",
            borderRadius: 9,
            background: "linear-gradient(180deg,#1c201e,#030504)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 62,
            bottom: 76,
            width: 56,
            height: 24,
            display: "flex",
            border: "4px solid #8b918d",
            background: "#010202",
            transform: "skewX(-8deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 56,
            bottom: 63,
            width: 24,
            height: 7,
            display: "flex",
            background: "#6fffee",
            boxShadow: "0 0 12px rgba(111,255,238,0.85)",
            transform: "rotate(13deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 56,
            bottom: 63,
            width: 24,
            height: 7,
            display: "flex",
            background: "#6fffee",
            boxShadow: "0 0 12px rgba(111,255,238,0.85)",
            transform: "rotate(-13deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 62,
            bottom: 45,
            width: 56,
            height: 4,
            display: "flex",
            background: "#b7bbb7",
            borderRadius: 999,
          }}
        />
      </div>
    ),
    size
  );
}
