"use client";

import { useEffect, useRef, useState } from "react";
import {
  ALL_VIDEOS,
  CHANNEL_URL,
  MAGAZINES,
  PAGE_CONTENT,
  PLAYLIST_FIND_URL,
  PLAYLIST_QUEEN_URL,
  type Magazine,
  type Video,
} from "@/lib/data";

const ROUTES = ["home", "magazine", "youtube", "find", "about", "notice", "board"] as const;

// 유튜브 섹션 타이틀: 메인(home)=크림슨 종족, 상단 메뉴=크림슨 퀸 / 크림슨 퀸을 찾아서
const TUBE_TITLE: Record<string, string> = {
  home: "크림슨 종족",
  youtube: "크림슨 퀸",
  find: "크림슨 퀸을 찾아서",
};
type Route = (typeof ROUTES)[number];

export default function Home() {
  const introRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const magTrackRef = useRef<HTMLDivElement>(null);
  const magViewportRef = useRef<HTMLDivElement>(null);
  const tubeTrackRef = useRef<HTMLDivElement>(null);
  const tubeViewportRef = useRef<HTMLDivElement>(null);
  const readerScrollRef = useRef<HTMLDivElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);
  const tigerCanvasRef = useRef<HTMLCanvasElement>(null);
  const textCanvasRef = useRef<HTMLCanvasElement>(null);

  const [readerOpen, setReaderOpen] = useState<Magazine | null>(null);
  const [readerProgress, setReaderProgress] = useState("1 / 1");
  const [playerOpen, setPlayerOpen] = useState<Video | null>(null);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  // 유튜브 섹션 타이틀/링크용 현재 라우트
  const [tubeRoute, setTubeRoute] = useState<"home" | "youtube" | "find">("home");

  // 캐러셀/드래그/인트로 — 명령형 로직은 useEffect 안에서 실행
  useEffect(() => {
    const $ = <T extends Element>(s: string, r: Document | Element = document) =>
      r.querySelector<T>(s);
    const $$ = <T extends Element>(s: string, r: Document | Element = document) =>
      [...r.querySelectorAll<T>(s)];

    const magTrack = magTrackRef.current!;
    const magViewport = magViewportRef.current!;
    const tubeTrack = tubeTrackRef.current!;
    const tubeViewport = tubeViewportRef.current!;
    const stageEl = stageRef.current!;
    const intro = introRef.current!;
    const toastEl = toastRef.current!;
    const paintMap = document.getElementById("paintMap");
    const paintSpot = document.getElementById("paintSpot");

    let toastT: ReturnType<typeof setTimeout>;
    function toast(msg: string) {
      toastEl.textContent = msg;
      toastEl.classList.add("show");
      clearTimeout(toastT);
      toastT = setTimeout(() => toastEl.classList.remove("show"), 2200);
    }

    /* ---------- 매거진 캐러셀 ---------- */
    const magCards = () => $$<HTMLElement>(".mag-card", magTrack);
    let magIndex = 0;
    let magTranslate = 0;
    let magSafetyTimer: ReturnType<typeof setTimeout> | undefined;
    const magVeils = $$<HTMLElement>(".mag-card__veil", magTrack);

    // 카드 치수: 숨김 프로브(width:var(--mag-active-w))를 실측 → vw 등 단위까지 px로 해석.
    // CSS 미디어쿼리가 바뀌면 프로브 폭도 자동 갱신되어 CSS와 항상 일치 (반응형 포함, PC 동일).
    let _magActiveW = 250;
    let _magGap = 26;
    const magProbe = document.createElement("div");
    magProbe.setAttribute("aria-hidden", "true");
    magProbe.style.cssText =
      "position:absolute;left:0;top:0;height:0;visibility:hidden;pointer-events:none;width:var(--mag-active-w);";
    magViewport.appendChild(magProbe);
    function refreshMagMetrics() {
      const a = magProbe.getBoundingClientRect().width;
      if (a > 0) _magActiveW = a;
      const g = parseFloat(getComputedStyle(magTrack).columnGap);
      if (Number.isFinite(g) && g >= 0) _magGap = g;
    }
    refreshMagMetrics();
    const magActiveW = () => _magActiveW;
    const magGap = () => _magGap;

    // 매 프레임 호출: 각 카드 중심과 화면 중앙의 거리로 --reveal 연속 계산
    // → 가운데로 다가오는 카드는 점점 펴지고, 가운데를 벗어나는 카드는 점점 접힘
    function syncMagVeils() {
      const vw = document.documentElement.clientWidth;
      const viewportCenter = vw / 2;
      const activeW = magActiveW();
      const inactiveW = activeW * 0.4;
      const gap = magGap();
      // 다음 카드 중심까지의 거리 = (활성/2 + gap + 비활성/2)
      const threshold = activeW / 2 + gap + inactiveW / 2;
      for (let i = 0; i < magVeils.length; i++) {
        const card = magVeils[i].parentElement as HTMLElement | null;
        if (!card) continue;
        const cRect = card.getBoundingClientRect();
        const cardCenter = cRect.left + cRect.width / 2;
        const distance = Math.abs(cardCenter - viewportCenter);
        const t = Math.min(1, distance / threshold);
        // smoothstep으로 부드러운 fold/unfold
        const reveal = 1 - t * t * (3 - 2 * t);
        card.style.setProperty("--reveal", reveal.toFixed(3));
      }
    }

    function applyMagTransform(anim: boolean) {
      // .55s — 카드 width transition(.55s)과 동일하게 맞춰 동기화
      magTrack.style.transition = anim ? "transform .55s cubic-bezier(.22,.61,.36,1)" : "none";
      magTrack.style.transform = `translateX(${magTranslate}px)`;
    }

    function centerMag(index: number, anim = true) {
      const cards = magCards();
      index = Math.max(0, Math.min(cards.length - 1, index));
      magIndex = index;
      cards.forEach((c, i) => c.classList.toggle("is-active", i === index));
      // text-moved 상태일 때만 logo 위치 갱신 (인트로 중에는 left transform이 적용되면 안 됨)
      if (intro.classList.contains("text-moved")) applyLogoMove();
      requestAnimationFrame(() => {
        const vRect = magViewport.getBoundingClientRect();
        // 활성 카드 중심을 window 중앙에 맞추기 위해 트랙 translate 계산
        const vw = document.documentElement.clientWidth;
        const windowCenter = vw / 2;
        const activeW = magActiveW();
        const inactiveW = activeW * 0.4; // 비활성은 활성 폭의 40%
        const gap = magGap();
        const padLeft = 0.5 * vw; // .mag__track padding:0 50vw
        let cardLeftInTrack = padLeft;
        for (let i = 0; i < index; i++) cardLeftInTrack += inactiveW + gap;
        magTranslate = windowCenter - vRect.left - cardLeftInTrack - activeW / 2;
        applyMagTransform(anim);
      });
      // 안전장치: width transition 완료 후 실제 카드 위치 재측정
      // 이전 centerMag의 pending safety는 취소(연쇄 호출 시 서로 다른 인덱스로 보정해 왔다갔다 방지)
      clearTimeout(magSafetyTimer);
      magSafetyTimer = setTimeout(() => {
        // 더블 가드: 그 사이에 다시 centerMag가 호출되어 magIndex가 바뀌었으면 무시
        if (magIndex !== index) return;
        const card = cards[index];
        if (!card) return;
        const cRect = card.getBoundingClientRect();
        const windowCenter = document.documentElement.clientWidth / 2;
        const cardCenter = cRect.left + cRect.width / 2;
        const delta = windowCenter - cardCenter;
        if (Math.abs(delta) > 3) {
          magTranslate += delta;
          applyMagTransform(true);
        }
      }, 750);
    }

    function nearestMagIndex() {
      const cards = magCards();
      const vRect = magViewport.getBoundingClientRect();
      const viewCenter = vRect.left + vRect.width / 2;
      let best = 0,
        bestD = Infinity;
      cards.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - viewCenter);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return best;
    }

    function openActiveMagazine() {
      const m = MAGAZINES[magIndex];
      if (!m) return;
      if (m.ready && m.pages > 0) setReaderOpen(m);
      else toast(`${m.issue} — 준비 중입니다`);
    }

    // 드래그 핸들러가 setPointerCapture(magViewport)를 호출하면 click의 target이
    // 카드가 아닌 magViewport가 됨. → viewport에 부착 + elementFromPoint 폴백
    const onMagTrackClick = (e: MouseEvent) => {
      if (dragMoved) return;
      let card = (e.target as HTMLElement).closest<HTMLElement>(".mag-card");
      if (!card) {
        const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        card = el?.closest<HTMLElement>(".mag-card") ?? null;
      }
      if (!card) return;
      const i = +card.dataset.index!;
      if (i === magIndex) openActiveMagazine();
      else centerMag(i);
    };
    magViewport.addEventListener("click", onMagTrackClick);

    // 휠/트랙패드: 트랙을 직접 밀고, 위치에 따라 가장 가까운 카드를 active 토글
    //   → CSS width transition(.55s)이 연속 호출을 부드럽게 retarget해 늘어남/줄어듦 애니메이션 지속
    //   → 정지 후 200ms 뒤에 스냅 — gesture 시작 위치 기준으로 ADVANCE_BIAS 이상 움직이면 다음 카드로
    let wheelSnapTimer: ReturnType<typeof setTimeout> | undefined;
    let wheelStartTranslate: number | null = null; // gesture 시작 시 magTranslate 기억
    let wheelStartIdx = 0;                          // gesture 시작 시 magIndex 기억
    const WHEEL_SENS = 0.35;            // 휠 delta → translate 변환 감도 (낮을수록 둔감)
    const WHEEL_MAX_PER_EVT = 50;       // 단일 이벤트당 최대 이동 px — 강한 swipe 폭주 방지
    const WHEEL_SNAP_DELAY = 200;       // 정지 감지 → 스냅까지 대기
    const ADVANCE_BIAS = 0.25;          // 카드 간격의 25%만 넘어도 다음 카드로 advance (낮을수록 더 쉽게 넘어감)

    // 트랙 magTranslate를 기준으로 "이론적 카드 중심"이 화면 중앙과 가장 가까운 인덱스 계산
    //   (실측 getBoundingClientRect는 width transition 중 진동할 수 있어 공식 기반으로 안정화)
    function nearestMagIndexByTranslate() {
      const vw = document.documentElement.clientWidth;
      const windowCenter = vw / 2;
      const activeW = magActiveW();
      const inactiveW = activeW * 0.4;
      const gap = magGap();
      const padLeft = 0.5 * vw;
      const vRect = magViewport.getBoundingClientRect();
      const cards = magCards();
      let bestK = 0;
      let bestD = Infinity;
      for (let k = 0; k < cards.length; k++) {
        const cardCenter =
          vRect.left + magTranslate + padLeft + k * (inactiveW + gap) + activeW / 2;
        const d = Math.abs(windowCenter - cardCenter);
        if (d < bestD) {
          bestD = d;
          bestK = k;
        }
      }
      return bestK;
    }

    // magTranslate 가 첫 카드 / 마지막 카드 위치를 넘지 않도록 클램프
    //   maxTranslate: 첫 카드(0)가 중앙에 있을 때의 값
    //   minTranslate: 마지막 카드가 중앙에 있을 때의 값
    function magTranslateBounds() {
      const vw = document.documentElement.clientWidth;
      const windowCenter = vw / 2;
      const activeW = magActiveW();
      const inactiveW = activeW * 0.4;
      const gap = magGap();
      const padLeft = 0.5 * vw;
      const vRect = magViewport.getBoundingClientRect();
      const cards = magCards();
      const lastIdx = Math.max(0, cards.length - 1);
      const base = windowCenter - vRect.left - padLeft - activeW / 2;
      const maxTranslate = base; // index 0
      const minTranslate = base - lastIdx * (inactiveW + gap); // index N-1
      return { minTranslate, maxTranslate };
    }

    const onMagWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(delta) < 1) return;
      // gesture 시작 — 시작 시점의 translate/index 기억
      if (wheelStartTranslate === null) {
        wheelStartTranslate = magTranslate;
        wheelStartIdx = magIndex;
      }
      // capping — 트랙패드 강한 swipe도 부드럽게
      const capped = Math.sign(delta) * Math.min(WHEEL_MAX_PER_EVT, Math.abs(delta));
      magTranslate -= capped * WHEEL_SENS;
      // 첫/마지막 카드 경계로 클램프 — over-scroll 방지
      const { minTranslate, maxTranslate } = magTranslateBounds();
      magTranslate = Math.max(minTranslate, Math.min(maxTranslate, magTranslate));
      applyMagTransform(false); // 트랜지션 없이 트랙 직접 이동

      // 현재 위치에서 가장 가까운 카드를 active로 — width transition 연속 발동
      const closestIdx = nearestMagIndexByTranslate();
      if (closestIdx !== magIndex) {
        magIndex = closestIdx;
        const cards = magCards();
        cards.forEach((c, i) => c.classList.toggle("is-active", i === closestIdx));
        if (intro.classList.contains("text-moved")) applyLogoMove();
      }

      // 정지 감지 → bias 적용해 advance 판정 (조금만 움직여도 다음 카드로 넘어감)
      clearTimeout(wheelSnapTimer);
      wheelSnapTimer = setTimeout(() => {
        const startTrans = wheelStartTranslate as number;
        const totalMove = magTranslate - startTrans; // 음수: forward, 양수: backward
        const vw = document.documentElement.clientWidth;
        const activeW = magActiveW();
        const inactiveW = activeW * 0.4;
        const cardSpacing = inactiveW + 26;
        // 카드 간격의 ADVANCE_BIAS 만큼만 넘어도 다음 카드로 넘어가도록 반올림 bias
        // rawSteps = 0.30 → round(0.55) = 1 (advance)
        // rawSteps = 0.10 → round(0.35) = 0 (snap back)
        // rawSteps = 1.30 → round(1.55) = 2 (advance 2)
        const rawSteps = -totalMove / cardSpacing;
        const steps = Math.round(rawSteps + Math.sign(rawSteps) * ADVANCE_BIAS);
        const cards = magCards();
        const targetIdx = Math.max(0, Math.min(cards.length - 1, wheelStartIdx + steps));
        centerMag(targetIdx);
        wheelStartTranslate = null; // gesture 종료
      }, WHEEL_SNAP_DELAY);
    };
    magViewport.addEventListener("wheel", onMagWheel, { passive: true });

    /* ---------- 유튜브 스트립 ---------- */
    let tubeTranslate = 0;
    function clampTube() {
      const max = 0;
      const min = Math.min(0, tubeViewport.clientWidth - tubeTrack.scrollWidth);
      tubeTranslate = Math.max(min, Math.min(max, tubeTranslate));
    }
    function applyTubeTransform(anim: boolean) {
      tubeTrack.style.transition = anim ? "transform .55s cubic-bezier(.22,.61,.36,1)" : "none";
      tubeTrack.style.transform = `translateX(${tubeTranslate}px)`;
    }

    const onTubeTrackClick = (e: MouseEvent) => {
      if (dragMoved) return;
      // pointer capture로 인해 e.target이 viewport가 될 수 있어 좌표 기반으로도 탐색
      let card = (e.target as HTMLElement).closest<HTMLElement>(".tube-card");
      if (!card) {
        const hit = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        card = hit?.closest<HTMLElement>(".tube-card") || null;
      }
      if (!card) return;
      const v = ALL_VIDEOS.find((x) => x.id === card.dataset.id);
      if (v && v.ready) setPlayerOpen(v);
      else toast("다음 에피소드 준비 중입니다");
    };
    // tubeTrack은 transform으로 위치가 바뀌므로, 더 안정적인 viewport에 click을 부착
    tubeViewport.addEventListener("click", onTubeTrackClick);

    /* ---------- 공용 드래그 핸들러 ---------- */
    let dragMoved = false;
    const dragCleanups: Array<() => void> = [];
    function makeDraggable(
      viewport: HTMLElement,
      getT: () => number,
      setT: (v: number, anim: boolean) => void,
      onEnd: (vel: number) => void,
      canStart?: () => boolean,
    ) {
      let down = false,
        startX = 0,
        startT = 0,
        lastX = 0,
        lastV = 0,
        lastTime = 0;
      const onDown = (e: PointerEvent) => {
        if (canStart && !canStart()) return; // 비활성 라우트(예: 목록형 상세)에서는 드래그 안 함
        down = true;
        dragMoved = false;
        startX = e.clientX;
        startT = getT();
        lastX = e.clientX;
        lastTime = performance.now();
        viewport.classList.add("dragging");
        viewport.setPointerCapture(e.pointerId);
      };
      const onMove = (e: PointerEvent) => {
        if (!down) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 8) dragMoved = true;
        const now = performance.now();
        lastV = (e.clientX - lastX) / Math.max(1, now - lastTime);
        lastX = e.clientX;
        lastTime = now;
        setT(startT + dx, false);
      };
      const onUp = (e: PointerEvent) => {
        if (!down) return;
        down = false;
        viewport.classList.remove("dragging");
        try {
          viewport.releasePointerCapture(e.pointerId);
        } catch {}
        // 실제 드래그가 일어났을 때만 onEnd 호출
        // (순수 클릭 시 onEnd가 centerMag(nearest)을 부르면 직후 click 핸들러의 centerMag(clicked)와 충돌)
        if (dragMoved) onEnd(lastV);
        setTimeout(() => (dragMoved = false), 0);
      };
      viewport.addEventListener("pointerdown", onDown);
      viewport.addEventListener("pointermove", onMove);
      viewport.addEventListener("pointerup", onUp);
      viewport.addEventListener("pointercancel", onUp);
      dragCleanups.push(() => {
        viewport.removeEventListener("pointerdown", onDown);
        viewport.removeEventListener("pointermove", onMove);
        viewport.removeEventListener("pointerup", onUp);
        viewport.removeEventListener("pointercancel", onUp);
      });
    }

    makeDraggable(
      magViewport,
      () => magTranslate,
      (v) => {
        const { minTranslate, maxTranslate } = magTranslateBounds();
        magTranslate = Math.max(minTranslate, Math.min(maxTranslate, v));
        applyMagTransform(false);
      },
      (vel) => {
        let idx = nearestMagIndex();
        if (Math.abs(vel) > 0.45) idx += vel < 0 ? 1 : -1;
        centerMag(idx);
      },
    );

    // 카드 한 칸 이동 거리(카드폭 + gap 16)
    function tubeStep() {
      const first = tubeTrack.querySelector<HTMLElement>(".tube-card");
      return first ? first.offsetWidth + 16 : 316;
    }
    makeDraggable(
      tubeViewport,
      () => tubeTranslate,
      (v) => {
        tubeTranslate = v;
        applyTubeTransform(false);
      },
      // 매거진 캐러셀과 동일한 느낌: 한 칸 단위 스냅 + 임계점(0.45) 플릭
      (vel) => {
        const step = tubeStep();
        let idx = Math.round(-tubeTranslate / step);
        if (Math.abs(vel) > 0.45) idx += vel < 0 ? 1 : -1;
        tubeTranslate = -idx * step;
        clampTube();
        applyTubeTransform(true);
      },
      () => document.body.dataset.route === "home", // 상세(목록형)에서는 캐러셀 드래그 비활성
    );

    const onWheel = (e: WheelEvent) => {
      if (document.body.dataset.route !== "home") return; // 상세는 네이티브 세로 스크롤
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      tubeTranslate -= e.deltaY;
      clampTube();
      applyTubeTransform(false);
    };
    tubeViewport.addEventListener("wheel", onWheel, { passive: true });

    /* ---------- 라우팅 ---------- */
    function setRoute(route: string, push = true) {
      const r = (ROUTES.includes(route as Route) ? route : "home") as Route;
      // 메인(home)으로 가면 첫번째 매거진으로 리셋 — 로고 클릭 시 "메인 화면"으로 복귀
      if (r === "home") magIndex = 0;
      document.body.dataset.route = r;
      document.body.classList.toggle("show-mag", r === "home" || r === "magazine");
      document.body.classList.toggle("show-tube", r === "home" || r === "youtube" || r === "find");
      // 유튜브 섹션 타이틀/링크 갱신 (React 상태)
      setTubeRoute(r === "youtube" || r === "find" ? r : "home");
      $$<HTMLElement>(".nav__item").forEach((a) =>
        a.classList.toggle("is-active", a.dataset.route === r),
      );
      const pageView = $<HTMLElement>("#pageView");
      const pageInner = $<HTMLElement>("#pageViewInner");
      if (PAGE_CONTENT[r] && pageView && pageInner) {
        pageInner.innerHTML = `<h1>${PAGE_CONTENT[r].h}</h1><p>${PAGE_CONTENT[r].p}</p>`;
        pageView.hidden = false;
      } else if (pageView) {
        pageView.hidden = true;
      }
      if (push && location.hash !== "#" + r) {
        history.replaceState(null, "", "#" + r);
      }
      // 비-home 라우트로 갈 때는 좌측→상단 애니메이션 없이 즉시 헤더에 안착
      if (intro.classList.contains("text-moved")) {
        applyLogoMove(r !== "home");
      }
      requestAnimationFrame(() => {
        magTranslate = 0;
        applyMagTransform(false);
        centerMag(magIndex, false);
        tubeTranslate = 0;
        clampTube();
        applyTubeTransform(false);
      });
    }

    const COMING_SOON_ROUTES = new Set(["about", "notice", "board"]);
    const topbarEl = $<HTMLElement>("#topbar");
    const navToggle = $<HTMLButtonElement>("#navToggle");
    const closeNav = () => {
      topbarEl?.classList.remove("nav-open");
      navToggle?.setAttribute("aria-expanded", "false");
    };
    const onNavToggle = () => {
      const open = topbarEl?.classList.toggle("nav-open") ?? false;
      navToggle?.setAttribute("aria-expanded", String(open));
    };
    navToggle?.addEventListener("click", onNavToggle);

    const onNavClick = (e: Event) => {
      e.preventDefault();
      const a = e.currentTarget as HTMLElement;
      const route = a.dataset.route!;
      closeNav(); // 모바일 드로어 닫기
      if (COMING_SOON_ROUTES.has(route)) {
        setComingSoonOpen(true);
        return;
      }
      setRoute(route);
    };
    const navEls = $$<HTMLElement>("[data-route]");
    navEls.forEach((a) => a.addEventListener("click", onNavClick));
    const onHash = () => setRoute((location.hash || "#home").slice(1), false);
    window.addEventListener("hashchange", onHash);

    /* ---------- 매거진 리더 스크롤 진행도 ---------- */
    const onReaderScroll = () => {
      const scroll = readerScrollRef.current;
      if (!scroll) return;
      const imgs = $$<HTMLImageElement>("img", scroll);
      if (!imgs.length) return;
      const mid = scroll.scrollTop + scroll.clientHeight / 2;
      let cur = 1;
      let acc = 0;
      for (let i = 0; i < imgs.length; i++) {
        acc += imgs[i].offsetHeight + 18;
        if (mid < acc) {
          cur = i + 1;
          break;
        }
        cur = imgs.length;
      }
      setReaderProgress(`${cur} / ${imgs.length}`);
    };
    // 이벤트 등록은 reader가 열릴 때 별도 effect에서 수행

    /* ---------- ESC 키 ---------- */
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setComingSoonOpen(false);
        setPlayerOpen((p) => {
          if (p) return null;
          setReaderOpen(null);
          return p;
        });
      }
    };
    document.addEventListener("keydown", onKey);

    /* ---------- 커서 주변 물감 왜곡 루프 ---------- */
    const SPOT_R = 220;
    let dScale = 0,
      dTarget = 0,
      lx: number | null = null,
      ly = 0;
    let cx = -9999,
      cy = -9999,
      filterOn = false;
    let rafId = 0;

    const onPointerMove = (e: PointerEvent) => {
      cx = e.clientX;
      cy = e.clientY;
      if (lx !== null) {
        const v = Math.hypot(e.clientX - lx, e.clientY - ly);
        dTarget = Math.min(30, dTarget + v * 0.8);
      }
      lx = e.clientX;
      ly = e.clientY;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    function distortLoop() {
      syncMagVeils();
      dTarget *= 0.9;
      dScale += (dTarget - dScale) * 0.14;
      paintSpot?.setAttribute("x", (cx - SPOT_R).toFixed(1));
      paintSpot?.setAttribute("y", (cy - SPOT_R).toFixed(1));
      const reader = document.getElementById("reader");
      const player = document.getElementById("player");
      const canShow =
        (!reader || reader.hidden) && (!player || player.hidden) && intro.style.display === "none";
      if (dScale > 0.4 && canShow) {
        if (!filterOn) {
          filterOn = true;
          stageEl.style.filter = "url(#paintDistort)";
        }
        paintMap?.setAttribute("scale", dScale.toFixed(2));
      } else if (filterOn) {
        filterOn = false;
        paintMap?.setAttribute("scale", "0");
        stageEl.style.filter = "none";
      }
      rafId = requestAnimationFrame(distortLoop);
    }
    rafId = requestAnimationFrame(distortLoop);

    /* ---------- 인트로 타임라인 ---------- */
    let booted = false;
    function bootLayout() {
      if (booted) return;
      booted = true;
      document.body.classList.add("booted");
      // 카드 등장 staggered delay: 중앙(활성 index 0)부터 가장자리로 차례대로 올라옴
      const initialCards = magCards();
      initialCards.forEach((card, i) => {
        const distance = Math.abs(i - 0);
        card.style.setProperty("--stagger-delay", `${distance * 90}ms`);
      });
      setRoute((location.hash || "#home").slice(1), false);
      requestAnimationFrame(() => centerMag(0, false));
    }

    /* ---------- 워터컬러 리빌 (soft dab + 거친 streak + wet bleed + edge 농축) ---------- */
    // ▼▼ 튜닝 상수 (alpha=누적속도, BLEED=번짐량, EDGE_DENSITY=가장자리 농도) ▼▼
    const MAIN_DAB_ALPHA_MIN = 0.035;  // 메인 dab 알파 (낮을수록 거친 streak이 도드라짐)
    const MAIN_DAB_ALPHA_MAX = 0.08;
    const SAT_ALPHA_MIN = 0.04;        // 위성 splatter 알파
    const SAT_ALPHA_MAX = 0.09;
    const STREAK_ALPHA_MIN = 0.05;     // 거친 streak 알파 (높을수록 거침)
    const STREAK_ALPHA_MAX = 0.11;
    const SPECK_ALPHA_MIN = 0.06;      // 끝쪽 점 알파
    const SPECK_ALPHA_MAX = 0.12;
    const STAMP_MAIN_COUNT = 5;
    const STAMP_SAT_COUNT = 3;
    const STAMP_MAIN_JITTER = 0.55;
    const STAMP_MAIN_SIZE_MIN = 0.45;
    const STAMP_MAIN_SIZE_MAX = 1.05;
    const STAMP_SAT_DIST_MIN = 0.7;
    const STAMP_SAT_DIST_MAX = 1.6;
    const STAMP_SAT_SIZE_MIN = 0.12;
    const STAMP_SAT_SIZE_MAX = 0.34;
    const STREAK_COUNT_MIN = 20;       // 메인 dab당 streak 개수 (많을수록 거침)
    const STREAK_COUNT_RAND = 14;
    const STREAK_LEN_MIN = 0.2;
    const STREAK_LEN_MAX = 0.95;
    const STREAK_DIR_JITTER = Math.PI / 12; // ±15°
    const SPECK_COUNT_MIN = 8;
    const SPECK_COUNT_RAND = 6;
    const BLEED = 2.4;                  // 0 ~ 6 (낮을수록 가장자리 깨끗)
    const BLEED_BLUR_MULT = 0.4;        // 프레임당 실제 blur(px) = BLEED * MULT
    const EDGE_BLUR_PX = 7;
    const EDGE_DENSITY = 0;             // 0 = 가장자리 농축 off (로고만 보임)
    const EDGE_COLOR = "#3d0a12";
    const WET_MS = 700;
    const BRUSH_BASE = 90;              // 백킹 픽셀 기준 메인 r
    const STAMPS_PER_FRAME = 13;        // 살짝 줄여 천천히 퍼지는 느낌
    const REVEAL_DURATION = 2300;       // 인트로 한 캔버스 리빌 시간(ms) - 좀 더 천천히
    const R_START_RATIO = 0.12;
    const R_GROW = 0.95;                // R = maxR*(0.12 + p*0.95), maxR = diag/2 * 1.05
    const VIGNETTE_INNER = 0.74;        // 마스크 비넷 시작(완전 opaque 비율)
    const VIGNETTE_OUTER = 1.0;         // 마스크 비넷 끝(완전 transparent)
    // ▲▲ 튜닝 상수 끝 ▲▲

    const tigerCanvas = tigerCanvasRef.current!;
    const textCanvas = textCanvasRef.current!;
    const revealHandles: Array<{ cancel: () => void }> = [];

    function loadImage(src: string): Promise<HTMLImageElement> {
      return new Promise((resolve, reject) => {
        const im = new Image();
        im.crossOrigin = "anonymous";
        im.onload = () => resolve(im);
        im.onerror = reject;
        im.src = src;
      });
    }

    function runBrushReveal(
      canvas: HTMLCanvasElement,
      src: HTMLImageElement,
      duration: number,
      mode: "reveal" | "erase" = "reveal",
    ): { cancel: () => void } {
      const W = canvas.width;
      const H = canvas.height;
      if (W < 2 || H < 2) {
        // 0크기 가드: 다음 프레임에 재시도
        let retryId = 0;
        let retryCancelled = false;
        const retry = () => {
          if (retryCancelled) return;
          if (canvas.width >= 2 && canvas.height >= 2) {
            const h = runBrushReveal(canvas, src, duration, mode);
            revealHandles.push(h);
          } else {
            retryId = requestAnimationFrame(retry);
          }
        };
        retryId = requestAnimationFrame(retry);
        return { cancel: () => { retryCancelled = true; cancelAnimationFrame(retryId); } };
      }
      const ctx = canvas.getContext("2d")!;
      const diag = Math.sqrt(W * W + H * H);
      const maxR = (diag / 2) * 1.05;

      const mask = document.createElement("canvas");
      mask.width = W;
      mask.height = H;
      const mctx = mask.getContext("2d")!;
      // Erase 모드: 현재 캔버스 상태(알파)를 마스크 초기값으로 → 깜박임 없이 reverse 시작
      if (mode === "erase") {
        mctx.drawImage(canvas, 0, 0);
      }

      const tmp = document.createElement("canvas");
      tmp.width = W;
      tmp.height = H;
      const tctx = tmp.getContext("2d")!;

      const edge = document.createElement("canvas");
      edge.width = W;
      edge.height = H;
      const ectx = edge.getContext("2d")!;

      // 비넷 마스크: 캔버스 가장자리(사각형 경계)에서 알파를 부드럽게 0으로 떨어뜨려
      // bleed가 가장자리에 누적되며 생기는 네모 테두리 흔적을 제거
      const vignette = document.createElement("canvas");
      vignette.width = W;
      vignette.height = H;
      {
        const vctx = vignette.getContext("2d")!;
        const cornerR = Math.hypot(W / 2, H / 2);
        const g = vctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, cornerR * VIGNETTE_OUTER);
        g.addColorStop(0, "rgba(0,0,0,1)");
        g.addColorStop(VIGNETTE_INNER, "rgba(0,0,0,1)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        vctx.fillStyle = g;
        vctx.fillRect(0, 0, W, H);
      }

      let wetUntil = 0;
      let start: number | null = null;
      let rafId = 0;
      let cancelled = false;
      const rnd = (a: number, b: number) => a + Math.random() * (b - a);

      // 메인 dab: 부드러운 radial gradient + 한 방향 streak/specks (거친 마른붓 표현)
      function drawMainMark(mx: number, my: number, mr: number) {
        // 1) Soft radial dab (커버리지)
        const a = rnd(MAIN_DAB_ALPHA_MIN, MAIN_DAB_ALPHA_MAX);
        const g = mctx.createRadialGradient(mx, my, 0, mx, my, mr);
        g.addColorStop(0, `rgba(255,255,255,${a})`);
        g.addColorStop(0.6, `rgba(255,255,255,${a * 0.5})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        mctx.globalAlpha = 1;
        mctx.fillStyle = g;
        mctx.beginPath();
        mctx.arc(mx, my, mr, 0, Math.PI * 2);
        mctx.fill();

        // 2) 거친 streak 오버레이 (한 방향 ±15°)
        const dir = Math.random() * Math.PI * 2;
        const cosD = Math.cos(dir);
        const sinD = Math.sin(dir);
        mctx.strokeStyle = "#fff";
        mctx.lineCap = "round";
        const sCount = STREAK_COUNT_MIN + Math.floor(Math.random() * STREAK_COUNT_RAND);
        for (let i = 0; i < sCount; i++) {
          const av = dir + (Math.random() - 0.5) * STREAK_DIR_JITTER * 2;
          const perp = (Math.random() - 0.5) * mr * 0.7;
          const along = (Math.random() - 0.5) * mr * 0.35;
          const sx2 = mx + cosD * along + sinD * perp;
          const sy2 = my + sinD * along - cosD * perp;
          const len = mr * rnd(STREAK_LEN_MIN, STREAK_LEN_MAX);
          mctx.globalAlpha = rnd(STREAK_ALPHA_MIN, STREAK_ALPHA_MAX);
          mctx.lineWidth = 1 + Math.random();
          mctx.beginPath();
          mctx.moveTo(sx2, sy2);
          mctx.lineTo(sx2 + Math.cos(av) * len, sy2 + Math.sin(av) * len);
          mctx.stroke();
        }
        // 3) 끝쪽 specks
        mctx.fillStyle = "#fff";
        const speckN = SPECK_COUNT_MIN + Math.floor(Math.random() * SPECK_COUNT_RAND);
        for (let i = 0; i < speckN; i++) {
          const along = mr * (0.25 + Math.random() * 0.55);
          const perp = (Math.random() - 0.5) * mr * 0.5;
          const px2 = mx + cosD * along + sinD * perp;
          const py2 = my + sinD * along - cosD * perp;
          mctx.globalAlpha = rnd(SPECK_ALPHA_MIN, SPECK_ALPHA_MAX);
          mctx.beginPath();
          mctx.arc(px2, py2, 0.5 + Math.random() * 1.5, 0, Math.PI * 2);
          mctx.fill();
        }
        mctx.globalAlpha = 1;
      }

      // 위성 dab (작은 splatter)
      function drawSatMark(px: number, py: number, sr: number) {
        const a = rnd(SAT_ALPHA_MIN, SAT_ALPHA_MAX);
        const g = mctx.createRadialGradient(px, py, 0, px, py, sr);
        g.addColorStop(0, `rgba(255,255,255,${a})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        mctx.globalAlpha = 1;
        mctx.fillStyle = g;
        mctx.beginPath();
        mctx.arc(px, py, sr, 0, Math.PI * 2);
        mctx.fill();
      }

      function stamp(x: number, y: number) {
        const r = BRUSH_BASE;
        mctx.save();
        // reveal: 'lighter' (알파 누적) / erase: 'destination-out' (알파 제거)
        mctx.globalCompositeOperation = mode === "erase" ? "destination-out" : "lighter";
        for (let i = 0; i < STAMP_MAIN_COUNT; i++) {
          const jit = Math.random() * r * STAMP_MAIN_JITTER;
          const a = Math.random() * Math.PI * 2;
          const mx = x + Math.cos(a) * jit;
          const my = y + Math.sin(a) * jit;
          const mr = r * rnd(STAMP_MAIN_SIZE_MIN, STAMP_MAIN_SIZE_MAX);
          drawMainMark(mx, my, mr);
        }
        for (let i = 0; i < STAMP_SAT_COUNT; i++) {
          const dist = r * rnd(STAMP_SAT_DIST_MIN, STAMP_SAT_DIST_MAX);
          const a = Math.random() * Math.PI * 2;
          const px = x + Math.cos(a) * dist;
          const py = y + Math.sin(a) * dist;
          const sr = r * rnd(STAMP_SAT_SIZE_MIN, STAMP_SAT_SIZE_MAX);
          drawSatMark(px, py, sr);
        }
        mctx.restore();
        wetUntil = performance.now() + WET_MS;
      }

      function render(now: number) {
        // 1) 젖은 동안 mask 인플레이스 블러
        //  - reveal: source-over로 블러본을 덧그려 알파 누적+확산 (물감이 번지며 자란다)
        //  - erase : destination-in으로 블러본을 곱해 구멍이 번지며 자란다 (reveal의 역재생)
        if (BLEED > 0 && now < wetUntil) {
          mctx.save();
          mctx.globalCompositeOperation = mode === "erase" ? "destination-in" : "source-over";
          mctx.filter = `blur(${BLEED * BLEED_BLUR_MULT}px)`;
          mctx.drawImage(mask, 0, 0);
          mctx.filter = "none";
          mctx.restore();
        }
        // 1b) 비넷으로 마스크 가장자리 클립 (네모 테두리 제거)
        mctx.save();
        mctx.globalCompositeOperation = "destination-in";
        mctx.drawImage(vignette, 0, 0);
        mctx.restore();
        // 2) tmp = 이미지 cover-fill → destination-in mask
        tctx.globalCompositeOperation = "source-over";
        tctx.clearRect(0, 0, W, H);
        tctx.drawImage(src, 0, 0, W, H);
        tctx.globalCompositeOperation = "destination-in";
        tctx.drawImage(mask, 0, 0);
        tctx.globalCompositeOperation = "source-over";
        // 3) view: 투명 클리어 + tmp (인트로 배경이 cream이므로 cream-fill 생략)
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(tmp, 0, 0);
        // 4) 가장자리 농축 (EDGE_DENSITY > 0일 때만)
        if (EDGE_DENSITY > 0) {
          ectx.globalCompositeOperation = "source-over";
          ectx.clearRect(0, 0, W, H);
          ectx.drawImage(mask, 0, 0);
          ectx.globalCompositeOperation = "destination-out";
          ectx.filter = `blur(${EDGE_BLUR_PX}px)`;
          ectx.drawImage(mask, 0, 0);
          ectx.filter = "none";
          ectx.globalCompositeOperation = "source-in";
          ectx.fillStyle = EDGE_COLOR;
          ectx.fillRect(0, 0, W, H);
          ectx.globalCompositeOperation = "source-over";
          ctx.save();
          ctx.globalCompositeOperation = "multiply";
          ctx.globalAlpha = EDGE_DENSITY;
          ctx.drawImage(edge, 0, 0);
          ctx.restore();
        }
      }

      function frame(now: number) {
        if (cancelled) return;
        if (start === null) start = now;
        const t = Math.min(1, (now - start) / duration);

        if (t < 1) {
          // 자동 번짐 리빌: R = maxR × (0.12 + p × 0.95)
          const R = maxR * (R_START_RATIO + R_GROW * t);
          for (let i = 0; i < STAMPS_PER_FRAME; i++) {
            const a = Math.random() * Math.PI * 2;
            const rr = Math.sqrt(Math.random()) * R;
            stamp(W / 2 + Math.cos(a) * rr, H / 2 + Math.sin(a) * rr);
          }
        }

        render(now);

        if (t < 1 || now < wetUntil) {
          rafId = requestAnimationFrame(frame);
        }
      }
      rafId = requestAnimationFrame(frame);
      return {
        cancel: () => {
          cancelled = true;
          cancelAnimationFrame(rafId);
        },
      };
    }

    const preload = Promise.all([
      loadImage("/assets/tiger.png"),
      loadImage("/assets/textlogo.png"),
    ]);

    // 텍스트 로고를 좌측(매거진 섹션 세로 중앙)으로 이동시키기 위한 transform 계산
    const TIGER_ERASE_DURATION = 1200;     // 호랑이 erase 시간 (짧을수록 빠름)
    const TIGER_ERASE_START = 1500;        // erase 시작 시점(ms) — 리빌 진행 중에 컷오버
    // 헤더/로고 치수도 CSS 변수에서 읽어 반응형 대응 (PC는 동일 값)
    const cssRootPx = (name: string, fb: number) => {
      const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
      return Number.isFinite(v) ? v : fb;
    };
    const TOPBAR_H = () => cssRootPx("--topbar-h", 64);
    const MAG_BOTTOM = 310; // CSS의 body[data-route="home"] .mag bottom과 동기화 (40px 위로)
    const TEXT_MOVE_SCALE = 1.3;                   // 좌측 위치에서 텍스트 로고 확대 비율
    const HEADER_TEXT_HEIGHT = () => cssRootPx("--header-logo-h", 59);
    const HEADER_TEXT_LEFT = () => cssRootPx("--header-logo-left", 60);
    function logoMetrics() {
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      const logoW = Math.min(0.85 * Math.min(vw, vh), 0.9 * vw, 960);
      const logoH = (logoW * 1074) / 1126;
      const textH = (logoW * 330) / 1126;
      return { vw, vh, logoW, logoH, textH, cx: vw / 2, cy: vh / 2 };
    }
    // 좌측(매거진 섹션 세로 중앙) 위치 — magIndex === 0
    // 좌측 가용 공간(0 ~ cardLeft-30)의 중앙에 캔버스를 배치 → 텍스트가 안 잘림
    function computeLogoLeftTransform() {
      const { vw, vh, logoW, logoH, textH, cx, cy } = logoMetrics();
      const S = TEXT_MOVE_SCALE;
      const activeW = magActiveW();
      const cardLeft = cx - activeW / 2;
      const canvasW = logoW * S;
      const availableW = cardLeft - 30; // 카드 좌측 30px 마진까지 사용 가능
      // 캔버스 중앙을 가용 공간 중앙(availableW/2)에 정렬
      // canvasW > availableW면 일부가 화면 밖으로 빠지지만, 텍스트 콘텐츠는 캔버스 중앙에 있어 가운데 잘 보임
      const targetTextLeft = availableW / 2 - canvasW / 2;
      const magCenterY = (TOPBAR_H() + (vh - MAG_BOTTOM)) / 2 - 20;
      const dx = targetTextLeft - cx + (logoW * S) / 2;
      const dy = magCenterY - cy + (logoH * S) / 2 - (textH * S) / 2;
      return `translate(${dx}px, ${dy}px) scale(${S})`;
    }
    // 상단 헤더 위치 — 첫번째 매거진(magIndex 0)이 왼쪽으로 빠지면(magIndex !== 0)
    function computeLogoHeaderTransform() {
      const { logoW, logoH, textH, cx, cy } = logoMetrics();
      const S = HEADER_TEXT_HEIGHT() / textH;
      const targetTextLeft = HEADER_TEXT_LEFT();
      const targetTextCenterY = TOPBAR_H() / 2;
      const dx = targetTextLeft - cx + (logoW * S) / 2;
      const dy = targetTextCenterY - cy + (logoH * S) / 2 - (textH * S) / 2;
      return `translate(${dx}px, ${dy}px) scale(${S})`;
    }
    function applyLogoMove(skipAnim = false) {
      // 좌측 큰 로고는 home + magIndex=0 일 때만. 그 외(다른 라우트 or 캐러셀 이동)는 헤더
      const route = document.body.dataset.route || "home";
      // 태블릿·모바일(≤1024)에서는 좌측 대형 로고 대신 항상 헤더에 작게 고정
      const atLeft =
        document.documentElement.clientWidth > 1024 && route === "home" && magIndex === 0;
      // 로고가 헤더에 있는 상태를 클래스로 표시 → 텍스트 캔버스 클릭으로 home 이동 가능하게
      intro.classList.toggle("logo-at-header", !atLeft);
      const transform = atLeft ? computeLogoLeftTransform() : computeLogoHeaderTransform();
      const logoEl = intro.querySelector(".intro__logo") as HTMLElement | null;
      if (skipAnim && logoEl) {
        // transition 잠시 꺼서 즉시 적용
        logoEl.style.transition = "none";
        intro.style.setProperty("--logo-move", transform);
        void logoEl.offsetWidth; // force reflow
        requestAnimationFrame(() => {
          logoEl.style.transition = "";
        });
      } else {
        intro.style.setProperty("--logo-move", transform);
      }
    }

    let tigerRevealHandle: { cancel: () => void } | null = null;

    const introTimers: Array<ReturnType<typeof setTimeout>> = [];
    function runIntro() {
      intro.classList.add("play");
      preload.then(([tigerImg, textImg]) => {
        // 텍스트 리빌
        introTimers.push(
          setTimeout(() => {
            revealHandles.push(runBrushReveal(textCanvas, textImg, REVEAL_DURATION));
          }, 150),
        );
        // 호랑이 리빌
        introTimers.push(
          setTimeout(() => {
            tigerRevealHandle = runBrushReveal(tigerCanvas, tigerImg, REVEAL_DURATION + 100);
            revealHandles.push(tigerRevealHandle);
          }, 450),
        );
        // 호랑이 reverse erase (리빌 진행 중에 컷오버: 더 빠르게)
        introTimers.push(
          setTimeout(() => {
            if (tigerRevealHandle) tigerRevealHandle.cancel();
            revealHandles.push(
              runBrushReveal(tigerCanvas, tigerImg, TIGER_ERASE_DURATION, "erase"),
            );
          }, TIGER_ERASE_START),
        );
      });
      // 타임라인
      // text reveal: 150~2450ms (텍스트는 그대로)
      // tiger reveal: 450ms 시작 → 1500ms에서 erase로 컷오버
      // tiger erase: 1500~2700ms (1200ms, reveal 역재생 bleed)
      // 2800ms: 인트로 bg 페이드 + 호랑이 hide + bootLayout
      // 2900ms: 텍스트 캔버스 좌측으로 이동 시작
      const T: Array<[number, () => void]> = [
        [2800, () => {
          intro.classList.add("text-only");
          bootLayout();
        }],
        [2900, () => {
          // 비-home 초기 라우트(예: #about)면 좌측→상단 슬라이드 없이 즉시 헤더에 안착
          const route = document.body.dataset.route || "home";
          applyLogoMove(route !== "home");
          intro.classList.add("text-moved");
        }],
      ];
      T.forEach(([t, fn]) => introTimers.push(setTimeout(fn, t)));
    }
    function skipIntro() {
      if (booted) return; // 이미 인트로가 끝났으면 무시
      // 진행 중인 리빌/타이머 모두 정리
      revealHandles.forEach((h) => h.cancel());
      introTimers.forEach((t) => clearTimeout(t));
      // 인트로의 "최종 상태"로 즉시 점프 — 텍스트 로고는 완성해서 그대로 두고
      // 호랑이는 지워진 상태로. (인트로를 숨기지 않으므로 로고가 사라지지 않음)
      preload.then(([, textImg]) => {
        const tctx = textCanvas.getContext("2d");
        if (tctx) {
          tctx.clearRect(0, 0, textCanvas.width, textCanvas.height);
          tctx.drawImage(textImg, 0, 0, textCanvas.width, textCanvas.height);
        }
        const gctx = tigerCanvas.getContext("2d");
        if (gctx) gctx.clearRect(0, 0, tigerCanvas.width, tigerCanvas.height);
      });
      intro.classList.add("play", "text-only", "text-moved");
      bootLayout();
      // 로고를 최종 위치(좌측/헤더)로 애니메이션 없이 즉시 배치
      applyLogoMove(true);
    }
    const skipBtn = $<HTMLButtonElement>("#introSkip");
    skipBtn?.addEventListener("click", skipIntro);

    // 헤더 위치의 텍스트 캔버스 클릭 → 홈으로 이동
    const onLogoClick = () => {
      if (intro.classList.contains("logo-at-header")) setRoute("home");
    };
    textCanvas.addEventListener("click", onLogoClick);

    /* ---------- 리사이즈 ---------- */
    let rT: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(rT);
      rT = setTimeout(() => {
        refreshMagMetrics(); // 브레이크포인트 변경 시 카드 치수 갱신
        magTranslate = 0;
        applyMagTransform(false);
        centerMag(magIndex, false);
        tubeTranslate = 0;
        clampTube();
        applyTubeTransform(false);
        if (intro.classList.contains("text-moved")) applyLogoMove();
      }, 120);
    };
    window.addEventListener("resize", onResize);

    /* ---------- 초기 정렬 후 인트로 ---------- */
    centerMag(0, false);
    clampTube();
    runIntro();

    // reader scroll listener는 reader가 열릴 때마다 갱신되도록 attribute 노출
    (window as unknown as { __krimsonOnReaderScroll?: () => void }).__krimsonOnReaderScroll =
      onReaderScroll;

    return () => {
      magViewport.removeEventListener("click", onMagTrackClick);
      magViewport.removeEventListener("wheel", onMagWheel);
      tubeViewport.removeEventListener("click", onTubeTrackClick);
      tubeViewport.removeEventListener("wheel", onWheel);
      navEls.forEach((a) => a.removeEventListener("click", onNavClick));
      navToggle?.removeEventListener("click", onNavToggle);
      window.removeEventListener("hashchange", onHash);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      skipBtn?.removeEventListener("click", skipIntro);
      textCanvas.removeEventListener("click", onLogoClick);
      dragCleanups.forEach((fn) => fn());
      introTimers.forEach((t) => clearTimeout(t));
      revealHandles.forEach((h) => h.cancel());
      cancelAnimationFrame(rafId);
      clearTimeout(toastT!);
      clearTimeout(rT!);
    };
  }, []);

  // 리더 열릴 때: 스크롤 진행도, body 클래스 처리
  useEffect(() => {
    if (!readerOpen) return;
    document.body.classList.add("modal-open");
    const scroll = readerScrollRef.current;
    if (scroll) {
      scroll.scrollTop = 0;
      setReaderProgress(`1 / ${readerOpen.pages}`);
      const handler = (window as unknown as { __krimsonOnReaderScroll?: () => void })
        .__krimsonOnReaderScroll;
      const onScroll = () => handler?.();
      scroll.addEventListener("scroll", onScroll);
      return () => {
        scroll.removeEventListener("scroll", onScroll);
        document.body.classList.remove("modal-open");
      };
    }
    return () => document.body.classList.remove("modal-open");
  }, [readerOpen]);

  useEffect(() => {
    if (playerOpen) document.body.classList.add("modal-open");
    else document.body.classList.remove("modal-open");
  }, [playerOpen]);

  useEffect(() => {
    if (comingSoonOpen) document.body.classList.add("modal-open");
    else document.body.classList.remove("modal-open");
  }, [comingSoonOpen]);

  return (
    <>
      <header className="topbar" id="topbar">
        {/* 로고 자체는 좌측 텍스트 캔버스가 이동해서 차지, 여기는 영역(클릭 가능 area)만 유지 */}
        <a className="brand" data-route="home" href="#home" aria-label="monthly Krimson 홈" />
        <a className="nav__item nav__item--lead" data-route="magazine" href="#magazine">
          매거진
        </a>
        <a className="nav__item nav__item--lead" data-route="youtube" href="#youtube">
          크림슨 퀸
        </a>
        <a className="nav__item nav__item--lead" data-route="find" href="#find">
          크림슨 퀸을 찾아서
        </a>
        <nav className="nav" id="nav">
          <a className="nav__item" data-route="about" href="#about">
            소개
          </a>
          <a className="nav__item" data-route="notice" href="#notice">
            공지사항
          </a>
          <a className="nav__item" data-route="board" href="#board">
            자유게시판
          </a>
        </nav>
        {/* 모바일/태블릿 햄버거 (PC에서는 display:none) */}
        <button className="nav-toggle" id="navToggle" aria-label="메뉴" aria-expanded="false" type="button">
          <span /><span /><span />
        </button>
      </header>

      <section className="intro" id="intro" ref={introRef}>
        <div className="intro__logo">
          <canvas className="intro__tiger" ref={tigerCanvasRef} width={1126} height={739} aria-hidden />
          <canvas className="intro__text" ref={textCanvasRef} width={1126} height={330} aria-label="monthly Krimson" />
        </div>
        <button className="intro__skip" id="introSkip">
          SKIP
        </button>
      </section>

      <main className="stage" id="stage" ref={stageRef}>
        <div className="hero-brand" id="heroBrand">
          <img src="/assets/textlogo.png" alt="monthly Krimson" />
        </div>

        <div className="bg-tiger-right" aria-hidden>
          <img src="/assets/tiger.png" alt="" />
        </div>

        <section className="mag" id="mag" aria-label="매거진">
          <div className="mag__viewport" id="magViewport" ref={magViewportRef}>
            <div className="mag__track" id="magTrack" ref={magTrackRef}>
              {MAGAZINES.map((m, i) => (
                <article
                  key={m.id}
                  className={"mag-card" + (m.ready ? " is-ready" : "")}
                  data-index={i}
                  data-id={m.id}
                >
                  <img className="mag-card__cover" src={m.cover} alt={`${m.title} ${m.issue}`} />
                  <div className="mag-card__veil" />
                  <div className="mag-card__meta">
                    <div className="mag-card__issue">{m.issue}</div>
                    <div className="mag-card__title">{m.title}</div>
                    <span className="mag-card__tag">{m.ready ? "지금 읽기" : "준비 중"}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="mag__hint" id="magHint">
            드래그하여 다른 호 보기
          </div>
        </section>

        {/* 카드 위에서도 같은 위치에 호랑이가 이어 보이도록 — 어두운 veil에서만 옅게 비침.
            우측: 활성카드 오른쪽 접힌 카드 4장 그룹의 중앙. 좌측: 활성카드 왼쪽 접힌 카드 4장 그룹 중앙(미러). */}
        <div className="bg-tiger-right bg-tiger-right--over" aria-hidden>
          <img src="/assets/tiger.png" alt="" />
        </div>
        <div className="bg-tiger-right bg-tiger-right--over bg-tiger-right--over-left" aria-hidden>
          <img src="/assets/tiger.png" alt="" />
        </div>

        <section className="tube" id="tube" aria-label="유튜브 콘텐츠">
          <div className="tube__head">
            <h2 className="tube__title">{TUBE_TITLE[tubeRoute]}</h2>
            <span className="tube__divider" aria-hidden />
            <a
              className="tube__more"
              id="channelLink"
              href={
                tubeRoute === "find"
                  ? PLAYLIST_FIND_URL
                  : tubeRoute === "youtube"
                    ? PLAYLIST_QUEEN_URL
                    : CHANNEL_URL
              }
              target="_blank"
              rel="noopener"
            >
              {tubeRoute === "home" ? "채널 바로가기" : "재생목록 전체보기"} &nbsp;&rarr;
            </a>
          </div>
          <div className="tube__viewport" id="tubeViewport" ref={tubeViewportRef}>
            <div className="tube__track" id="tubeTrack" ref={tubeTrackRef}>
              {ALL_VIDEOS.map((v) => (
                <article
                  key={v.id}
                  className={"tube-card" + (v.ready ? " is-ready" : "")}
                  data-id={v.id}
                  data-list={v.list}
                >
                  <div className="tube-card__thumbwrap">
                    {v.ready ? (
                      <img className="tube-card__thumb" src={v.thumb} alt={v.title} loading="lazy" />
                    ) : (
                      <div className="tube-card__thumb" />
                    )}
                    <div className="tube-card__veil" />
                    <div className="tube-card__play">
                      <span />
                    </div>
                    {v.dur ? <div className="tube-card__dur">{v.dur}</div> : null}
                  </div>
                  <div className="tube-card__meta">
                    <div className="tube-card__ep">{v.ep}</div>
                    <div className="tube-card__title">{v.title}</div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="page-view" id="pageView" hidden>
          <div className="page-view__inner" id="pageViewInner" />
        </section>
      </main>

      <div className="reader" id="reader" hidden={!readerOpen}>
        <div className="reader__bar">
          <span className="reader__title" id="readerTitle">
            {readerOpen ? `${readerOpen.title} · ${readerOpen.issue}` : ""}
          </span>
          <span className="reader__progress" id="readerProgress">
            {readerProgress}
          </span>
          <button
            className="reader__close"
            id="readerClose"
            aria-label="닫기"
            onClick={() => setReaderOpen(null)}
          >
            ×
          </button>
        </div>
        <div className="reader__scroll" id="readerScroll" ref={readerScrollRef}>
          {readerOpen
            ? Array.from({ length: readerOpen.pages }, (_, i) => {
                const n = String(i + 1).padStart(2, "0");
                return (
                  <img
                    key={n}
                    loading={i < 2 ? "eager" : "lazy"}
                    src={`${readerOpen.pagePath}${n}.png`}
                    alt={`${i + 1} 페이지`}
                  />
                );
              })
            : null}
        </div>
      </div>

      <div className="player" id="player" hidden={!playerOpen}>
        <button
          className="player__close"
          id="playerClose"
          aria-label="닫기"
          onClick={() => setPlayerOpen(null)}
        >
          ×
        </button>
        <div className="player__frame" id="playerFrame">
          {playerOpen ? (
            <iframe
              src={`https://www.youtube.com/embed/${playerOpen.id}?autoplay=1&rel=0&modestbranding=1`}
              title={playerOpen.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : null}
        </div>
      </div>

      <div
        className="coming-soon"
        id="comingSoon"
        hidden={!comingSoonOpen}
        onClick={() => setComingSoonOpen(false)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="comingSoonTitle"
      >
        <div className="coming-soon__panel" onClick={(e) => e.stopPropagation()}>
          <button
            className="coming-soon__close"
            aria-label="닫기"
            onClick={() => setComingSoonOpen(false)}
          >
            ×
          </button>
          <div className="coming-soon__title" id="comingSoonTitle">
            준비 중입니다
          </div>
          <div className="coming-soon__desc">곧 만나보실 수 있습니다.</div>
        </div>
      </div>

      <div className="toast" id="toast" role="status" ref={toastRef} />
    </>
  );
}
