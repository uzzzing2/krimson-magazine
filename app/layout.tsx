import type { Metadata } from "next";
import "./globals.css";
import { BG_IMAGE } from "@/lib/data";

export const metadata: Metadata = {
  title: "monthly Krimson — Korea University Alumni Magazine",
  description: "고려대학교 교우 매거진 · 영상 콘텐츠(크림슨 퀸) 인터랙티브 사이트.",
  icons: { icon: "/assets/tiger.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
      </head>
      <body>
        {/* SVG 필터 defs (잉크/물감 왜곡) */}
        <svg className="svg-defs" aria-hidden="true">
          <defs>
            <filter
              id="paintDistort"
              x="-5%"
              y="-5%"
              width="110%"
              height="110%"
              colorInterpolationFilters="sRGB"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.006 0.009"
                numOctaves={2}
                seed={5}
                result="noise"
              >
                <animate attributeName="seed" values="5;6;5" dur="9s" repeatCount="indefinite" />
              </feTurbulence>
              <feImage
                id="paintSpot"
                result="spot"
                x={-400}
                y={-400}
                width={440}
                height={440}
                preserveAspectRatio="none"
                href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='440' height='440'%3E%3Cdefs%3E%3CradialGradient id='g'%3E%3Cstop offset='0' stop-color='white'/%3E%3Cstop offset='.45' stop-color='white' stop-opacity='.7'/%3E%3Cstop offset='1' stop-color='white' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='440' height='440' fill='url(%23g)'/%3E%3C/svg%3E"
              />
              <feComposite in="noise" in2="spot" operator="in" result="localNoise" />
              <feFlood floodColor="rgb(128,128,128)" result="flat" />
              <feMerge result="dispMap">
                <feMergeNode in="flat" />
                <feMergeNode in="localNoise" />
              </feMerge>
              <feDisplacementMap
                id="paintMap"
                in="SourceGraphic"
                in2="dispMap"
                scale={0}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>

            <filter id="ink" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.014 0.018"
                numOctaves={3}
                seed={4}
                result="n"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="n"
                scale={34}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>

            <filter id="ink-soft" x="-25%" y="-25%" width="150%" height="150%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.02 0.026"
                numOctaves={3}
                seed={11}
                result="n"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="n"
                scale={26}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>

            {/* 호랑이 PNG 가장자리 헤일로 제거 — 밝은 픽셀일수록 알파를 깎음.
                A_new = -R - G - B + 2.5*A. 호랑이 strokes(어두움)는 살아남고
                가장자리 반투명 light 픽셀은 음수로 클리핑되어 사라짐. */}
            <filter id="killHalo" x="0%" y="0%" width="100%" height="100%">
              <feColorMatrix
                type="matrix"
                values="1 0 0 0 0
                        0 1 0 0 0
                        0 0 1 0 0
                        -1 -1 -1 2.5 0"
              />
            </filter>
          </defs>
        </svg>

        <div className="tiger-bg" aria-hidden="true" />
        <div className="paper-grain" aria-hidden="true" />

        {/* 어드민 등록 풀스크린 배경 이미지 — BG_IMAGE 가 설정되면 fixed로 깔림.
            null일 때는 body cream 단색 배경. */}
        {BG_IMAGE ? (
          <div
            className="bg-fullscreen"
            aria-hidden="true"
            style={{ backgroundImage: `url(${BG_IMAGE})` }}
          />
        ) : null}

        {children}
      </body>
    </html>
  );
}
