# Triage — 디자인 시스템 (Liquid Glass)

> Apple **Liquid Glass**(WWDC 2025 · iOS 26) 디자인 언어를 웹(Next.js + Tailwind)으로 옮긴 기준 문서.
> 출처: Apple Human Interface Guidelines — Materials / Adopting Liquid Glass.

## 1. 3대 원칙 (협상 불가)

1. **Clarity (명료함)** — 반투명·블러를 쓰더라도 텍스트와 컨트롤은 항상 또렷하게. 투명도 과용 금지.
2. **Deference (양보)** — 유리 표면은 콘텐츠를 **감싸는 프레임**일 뿐, 주인공은 콘텐츠. UI가 콘텐츠를 압도하지 않는다.
3. **Depth (깊이)** — 반투명 레이어 + 스펙큘러 하이라이트 + 부드러운 그림자로 3차원적 층위를 만든다.

## 2. 머티리얼 (Liquid Glass)

유리는 단순 블러가 아니라 **빛에 반응하는 표면**이다.

- **Translucency**: 배경이 비쳐 보이되, 채도를 살짝 올려(saturate) 생기를 유지.
- **Specular highlight**: 표면 상단에 1px 밝은 하이라이트(빛 반사).
- **Soft depth shadow**: 멀리 떨어진 듯한 넓고 옅은 그림자.
- **Lensing**: 가장자리에서 살짝 굴절된 느낌(밝은 보더 + 안쪽 미세 그림자).

유리는 **구조적 레이어(헤더/패널/카드/칩)에만 선택적으로** 적용한다. 전체 화면을 유리로 덮지 않는다.

## 3. 토큰

### 배경 (유리가 비칠 캔버스)
은은한 컬러 그라데이션 메시 — 유리의 굴절이 보이도록.
```
--bg-base:  #eef1f6
--blob-1:   rgba(99,102,241,0.18)   /* indigo  */
--blob-2:   rgba(14,165,233,0.16)   /* sky     */
--blob-3:   rgba(236,72,153,0.10)   /* pink    */
```

### 유리 표면
```
--glass:        rgba(255,255,255,0.60)   backdrop-blur(20px) saturate(180%)
--glass-strong: rgba(255,255,255,0.72)
--glass-dark:   rgba(20,22,28,0.55)      /* 트레이스 콘솔 */
--glass-border: rgba(255,255,255,0.55)   /* 밝은 렌즈 보더 */
--glass-hi:     rgba(255,255,255,0.85)   /* 상단 스펙큘러 */
--glass-shadow: 0 8px 30px rgba(17,21,28,0.10)
```

### 콘텐츠 색 (시맨틱 · 적응형)
```
--ink:    #1d1d1f   /* 주요 텍스트 (Apple label)   */
--muted:  #5b6573   /* 보조 텍스트                 */
--faint:  #8b94a3   /* 캡션                        */
--accent: #0a6cff   /* 시스템 블루 (주요 액션)      */
--accent-weak: rgba(10,108,255,0.12)
--task:   #b45309 / bg rgba(245,158,11,0.16)   /* 행동 필요 */
--info:   #475569 / bg rgba(71,85,105,0.12)    /* 참고      */
--ok:     #15803d   --danger: #be123c
```

## 4. 형태 & 타이포

- **Shape**: 캡슐/둥근 모서리. 칩=999px, 카드=16px, 패널=24px. 그룹은 동심(concentric) 정렬.
- **Type**: 디스플레이/본문 = Geist Sans, 데이터/트레이스 = Geist Mono. 굵기는 절제(주로 500–700).
- **Spacing**: 8pt 그리드. 카드 내부 14–16px.

## 5. 모션

- 표면은 **부드럽게 등장·morph**(opacity + 4px translate, 0.28s ease-out).
- 라이브 상태는 은은한 펄스(트레이스 점).
- 과한 애니메이션 금지 — Depth를 보조할 때만.

## 6. 접근성 (필수)

- `prefers-reduced-transparency` → 유리를 **불투명 표면**으로 대체(블러 제거).
- `prefers-reduced-motion` → morph/펄스 정지.
- 대비: 본문 텍스트는 유리 위에서도 WCAG AA 충족(어두운 ink 유지).
- 포커스 링: 키보드 포커스 항상 가시(accent 링).

## 7. 컴포넌트 매핑

| 컴포넌트 | 머티리얼 |
|---|---|
| 헤더 | sticky 글래스 + 스펙큘러 하이라이트 |
| 구독 칩(SubscribeBar) | 캡슐 글래스 칩 |
| 피드 카드(FeedItemCard) | 글래스 카드 + 좌측 소스 컬러 렌즈 |
| 할 일 패널(TodoPanel) | 글래스 패널 |
| 트레이스(StreamingTrace) | 다크 글래스 콘솔 |
| 주요 버튼 | 솔리드 accent(글래스 위 대비 확보) |
| 토스트(undo) | 다크 글래스 캡슐 |
