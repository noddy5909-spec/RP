import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, "galpi.svg");

const WING = "#A2D2FF";
const WING_SOFT = "#BDE0FE";
const BODY = "#F8F9FA";
const BODY_SOFT = "#ECEFF1";
const PAGE = "#FFFDF6";
const BEAK = "#FFD166";
const EYE_LINE = "#2F3E46";
const BROWN = "#3D2B1F";

/** Illustrator export: 연속 M으로만 구분된 서브패스 분리 */
function splitCompound(d) {
  const t = d.trim();
  const rawParts = t.split(/\b(?=M[-0-9.])/i);
  const out = [];
  for (const p of rawParts) {
    let s = p.trim();
    if (!s) continue;
    if (!/z$/i.test(s)) s += "z";
    out.push(s);
  }
  return out.length ? out : [t];
}

/** 첫 path를 M으로 나눈 순서 = 형상 부위(일러스트 기준 고정) */
const COMPOUND_ORDER_COLORS = [
  BEAK, // 0 M573… 하단 발·발톱 덩어리
  BODY, // 1 M470… 목·볼 윤곽
  PAGE, // 2 M497… 책 페이지 음영
  WING_SOFT, // 3 M502… 날개·표지 하이라이트
  WING, // 4 M391… 왼쪽 날개·표지
  WING, // 5 M657… 오른쪽 원근 날개
  WING_SOFT, // 6 M620… 날개 접힌 면
  PAGE, // 7 M582… 책 안쪽 페이지 덩어리
  PAGE, // 8 M423… 책 등·페이지
  PAGE, // 9 M438… 아래 페이지 군데
  BODY, // 10 M544… 머리·윗깃 상단
  BODY_SOFT, // 11 M636… 작은 깃털 하이라이트
  EYE_LINE, // 12 M627… 눈동자
  BROWN, // 13 M370… 세밀 윤곽선
  BROWN, // 14 M592… 가는 윤곽
  WING, // 15 M360… 왼쪽 외곽·표지
];

function colorCompoundSub(si) {
  return COMPOUND_ORDER_COLORS[si] || BODY;
}

function standaloneFill(bi) {
  const map = {
    1: BODY,
    2: EYE_LINE,
    3: BEAK,
    4: BODY_SOFT,
    5: PAGE,
    6: PAGE,
    7: PAGE,
    8: PAGE,
    9: PAGE,
    10: PAGE,
    11: PAGE,
    12: PAGE,
    13: WING_SOFT,
    14: WING,
    15: WING,
    16: PAGE,
    17: PAGE,
    18: PAGE,
    19: PAGE,
    20: EYE_LINE,
    21: BEAK,
    22: EYE_LINE,
    23: EYE_LINE,
    24: EYE_LINE,
    25: EYE_LINE,
    26: BEAK,
    27: BEAK,
  };
  return map[bi] || BODY;
}

const raw = fs.readFileSync(SRC, "utf8");
const re =
  /<path\s+fill="[^"]+"\s+opacity="[^"]+"\s+stroke="none"\s+d="(.*?)"\s*\/>/gs;
const blocks = [];
let m;
while ((m = re.exec(raw)) !== null) blocks.push(m[1]);

const header = `<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
\t width="100%" viewBox="0 0 1024 544" enable-background="new 0 0 1024 544" xml:space="preserve">
<!-- 날개·책표지 #A2D2FF / #BDE0FE, 몸통·깃털 #F8F9FA, 페이지 #FFFDF6, 부리·발 #FFD166, 눈·선 #2F3E46·#3D2B1F -->
`;

const pieces = [];
for (let bi = 0; bi < blocks.length; bi++) {
  const subs = bi === 0 ? splitCompound(blocks[bi]) : [blocks[bi]];
  subs.forEach((sub, si) => {
    const fill = bi === 0 ? colorCompoundSub(si) : standaloneFill(bi);
    pieces.push(
      `<path fill="${fill}" opacity="1.000000" stroke="none" \n\td="\n${sub.trim()}\n"/>`
    );
  });
}

fs.writeFileSync(SRC, header + pieces.join("\n") + "\n</svg>\n", "utf8");
console.log("paths:", pieces.length);
