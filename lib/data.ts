export type Magazine = {
  id: string;
  title: string;
  issue: string;
  cover: string;
  pages: number;
  pagePath?: string;
  /** PDF 파일 경로(public 기준). 설정되면 reader가 PDF 뷰어(iframe)로 표시.
   *  없으면 기존 page-NN.png 이미지 스택으로 폴백. */
  pdf?: string;
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

// 어드민에서 등록하는 풀스크린 배경 이미지 (fixed). null이면 BG 비표시.
// TODO: 어드민 연결 후 실제 이미지 경로(예: "/assets/bg/main.jpg")로 교체
export const BG_IMAGE: string | null = null;

// 메인 m-home 섹션 슬로건 — 어드민에서 두 줄을 각각 입력.
// line2 비워두면 한 줄로 표시.
export type SectionSlogan = { line1: string; line2?: string };
export const SECTION_SLOGANS: Record<"magazine" | "queen" | "untold", SectionSlogan> = {
  magazine: { line1: "매달 새로 쓰는", line2: "우리들의 이야기" },
  queen:    { line1: "영상으로 펼치는", line2: "크림슨의 시선" },
  untold:   { line1: "지면에 담지 못한", line2: "진짜 이야기" },
};

// 푸터 SNS — TODO: 실제 계정 URL/이메일로 교체
export const INSTAGRAM_URL = "https://www.instagram.com/";
export const CONTACT_EMAIL = "contact@krimsonspecies.com";

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
    // PDF 업로드 후 활성화: pdf: "/assets/magazine/krimson-2026-06.pdf"
    // 미지정 시 page-NN.png 이미지 스택으로 표시
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

// 차마 못다한 이야기 — 어드민에서 직접 입력하는 YouTube 영상 1개 (모바일 홈 섹션)
// null이면 섹션 비표시. id는 YouTube video ID(예: "fNGqcb-tgJA").
export const UNTOLD_VIDEO: {
  id: string;
  ep?: string;
  title: string;
  dur?: string;
  /** 비워두면 https://i.ytimg.com/vi/${id}/hqdefault.jpg 사용 */
  thumb?: string;
} | null = {
  // TODO: 어드민 연결 후 실제 영상으로 교체
  id: "1zJIQss7fhc",
  ep: "임시 미리보기",
  title: "차마 못다한 이야기 — 어드민 연결 전 임시 영상",
  dur: "21:21",
  thumb: "/assets/youtube/1zJIQss7fhc.jpg",
};

/** 단일 라우트 페이지 콘텐츠 — image 또는 p 또는 둘 다 표시. */
export const PAGE_CONTENT: Record<
  string,
  { h: string; p?: string; image?: string }
> = {
  // #1 — 이미지 1장
  wonder: {
    h: "우리가 궁금해?",
    image: "/assets/who/1.jpeg",
  },
  // #2 — 임시 준비중 (최종: 이미지 1장 + 텍스트)
  regret: {
    h: "안 보면 후회할걸",
    p: "준비 중입니다.<br/>곧 만나보실 수 있습니다.",
  },
  // #6 — 임시 준비중 (최종: 직접 추가하는 유튜브 링크 1개)
  untold: {
    h: "차마 못다 한 이야기",
    p: "준비 중입니다.<br/>곧 만나보실 수 있습니다.",
  },
  // #7 — 이미지 1장
  sponsor: {
    h: "후원 및 광고 문의",
    image: "/assets/contact/7page.jpeg",
  },
};
