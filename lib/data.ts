export type Magazine = {
  id: string;
  title: string;
  issue: string;
  cover: string;
  pages: number;
  pagePath?: string;
  ready: boolean;
};

export type Video = {
  id: string;
  ep: string;
  title: string;
  dur: string;
  thumb: string;
  ready: boolean;
  /** "queen" = 크림슨 퀸, "find" = 크림슨 퀸을 찾아서, "upcoming" = 업로드 예정(메인에서만) */
  list: "queen" | "find" | "upcoming";
};

export const CHANNEL_URL = "https://www.youtube.com/@crimsonspecies";

// 재생목록
export const PLAYLIST_QUEEN_URL =
  "https://www.youtube.com/playlist?list=PL1AE1JOfuZv3B2GXO-zv2fKhq0yXNDYTb";
export const PLAYLIST_FIND_URL =
  "https://www.youtube.com/playlist?list=PL1AE1JOfuZv0DTbdMT2TT9-N8Yy4Z18Yq";

export const MAGAZINES: Magazine[] = [
  {
    id: "krimson-2026-06",
    title: "월간 크림슨",
    issue: "2026년 6월호 · 창간호",
    cover: "/assets/magazine/cover-01.png",
    pages: 75,
    pagePath: "/assets/magazine/page-",
    ready: true,
  },
  {
    id: "krimson-2026-07",
    title: "월간 크림슨",
    issue: "2026년 7월호 · 예정",
    cover: "/assets/magazine-cover/1.png",
    pages: 0,
    ready: false,
  },
  {
    id: "krimson-2026-08",
    title: "월간 크림슨",
    issue: "2026년 8월호 · 예정",
    cover: "/assets/magazine-cover/2.png",
    pages: 0,
    ready: false,
  },
  {
    id: "krimson-2026-09",
    title: "월간 크림슨",
    issue: "2026년 9월호 · 예정",
    cover: "/assets/magazine-cover/3.png",
    pages: 0,
    ready: false,
  },
  {
    id: "krimson-2026-10",
    title: "월간 크림슨",
    issue: "2026년 10월호 · 예정",
    cover: "/assets/magazine-cover/4.png",
    pages: 0,
    ready: false,
  },
];

// 크림슨 퀸 (상단 메뉴) — 재생목록 PL...YTb
export const VIDEOS_QUEEN: Video[] = [
  {
    id: "fNGqcb-tgJA",
    ep: "크림슨퀸 ep.1-1",
    title: "삼통치킨 지하에 숨겨진 비밀",
    dur: "1:52",
    thumb: "/assets/youtube/fNGqcb-tgJA.jpg",
    ready: true,
    list: "queen",
  },
  {
    id: "dXGbtmtrVGw",
    ep: "크림슨퀸 트레일러",
    title: "인류 종말 1000년 후 복원된 그녀의 정체는?",
    dur: "1:15",
    thumb: "/assets/youtube/dXGbtmtrVGw.jpg",
    ready: true,
    list: "queen",
  },
];

// 크림슨 퀸을 찾아서 (상단 메뉴) — 재생목록 PL...8Yq
export const VIDEOS_FIND: Video[] = [
  {
    id: "1zJIQss7fhc",
    ep: "우아한 오지랖의 여왕 EP.1",
    title: "회사 생활 네 번의 위기를 잘 극복할 수 있었던 이유",
    dur: "21:21",
    thumb: "/assets/youtube/1zJIQss7fhc.jpg",
    ready: true,
    list: "find",
  },
];

// 업로드 예정 — 메인(home) 미리보기에서만 노출
export const VIDEOS_UPCOMING: Video[] = [
  {
    id: "coming-1",
    ep: "크림슨퀸 ep.1-2",
    title: "다음 에피소드 준비 중",
    dur: "",
    thumb: "",
    ready: false,
    list: "upcoming",
  },
  {
    id: "coming-2",
    ep: "크림슨퀸 ep.1-3",
    title: "다음 에피소드 준비 중",
    dur: "",
    thumb: "",
    ready: false,
    list: "upcoming",
  },
];

// DOM 렌더 순서: 크림슨 퀸 → 찾아서 → 업로드 예정 (노출 여부는 라우트별 CSS로 제어)
export const ALL_VIDEOS: Video[] = [...VIDEOS_QUEEN, ...VIDEOS_FIND, ...VIDEOS_UPCOMING];

export const PAGE_CONTENT: Record<string, { h: string; p: string }> = {
  about: {
    h: "소개",
    p: "월간 크림슨은 고려대학교 교우들을 잇는 알럼나이 매거진입니다.<br/>붉은 호랑이의 기개를 담아 매월 새로운 이야기를 전합니다.<br/>매거진과 영상 콘텐츠 '크림슨 퀸'으로 교우 사회의 오늘을 기록합니다.",
  },
  notice: {
    h: "공지사항",
    p: "창간호(2026년 6월호)가 발행되었습니다.<br/>매월 말 신규 호와 '크림슨 퀸' 에피소드가 업데이트됩니다.<br/>교우 여러분의 많은 관심과 참여 부탁드립니다.",
  },
  board: {
    h: "자유게시판",
    p: "교우들의 이야기를 나누는 공간입니다.<br/>현재 베타 운영 중이며, 곧 정식 오픈 예정입니다.",
  },
};
