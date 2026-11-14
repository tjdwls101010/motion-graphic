# pstack 레퍼런스 장면

유튜브 영상 한 편(`references/pstack/pstack.mp4`, 24분)에 나오는 모션그래픽을 코드로 다시 만든 디자인 레퍼런스다. 앞으로 클로드로 모션그래픽을 만들 때 "이런 룩, 이런 움직임"을 말로 설명하는 대신 장면 파일을 가리키고 그 코드를 가져다 쓰려는 용도다.

- 장면 32개, 7개 계열. 전부 빌드 없이 브라우저에서 바로 열리는 HTML이다.
- 각 장면은 원본의 어느 구간을 재현했는지(`ref`)와 거기서 읽어 낸 모션 규칙(`Motion notes:`)을 파일 안에 적어 둔다.
- 원본에는 약 120개 샷이 있다. 전체 목록과 구현 여부는 [CATALOG.md](CATALOG.md), 계열별 룩과 모션 규칙은 [STYLE.md](STYLE.md)에 있다.

## 보는 법

```bash
open index.html
```

갤러리의 카드에 마우스를 올리면 그 자리에서 장면이 재생되고, 클릭하면 장면이 크게 열린다. 장면을 열면 아래에 재생 막대가 나온다. 스페이스로 재생·정지, 좌우 화살표로 한 프레임씩 이동한다. 주소에 `?t=3.2`를 붙이면 3.2초에서 멈춘 채 열린다.

## 구조

```
kit/        공용 코드. 장면이 <script src>와 <link>로 불러 쓴다
  motion.js   시간 함수: prog, kf, ease, rng, onTwos, typed
  stage.js    1920x1080 스테이지, 재생 막대, 캡처 훅 (MG.scene)
  sketch.js   손그림 펜, 종이, 스틱맨, 로봇, 태그 (canvas)
  ui.css/js   흰색 카드, 오도미터, 브라우저 창, 형광펜, 칩
  felt.js/css 펠트 보드, 폴라로이드, 실, 이름표, 감자 (SVG)
  terminal.*  터미널 창, 타이핑 줄, 키캡, 화살표 라벨
  set.js      책상, 휴대폰, 만년필, 걷는 인물, 버그
  overlay.*   얼굴 캠 대체 배경, 테이프 라벨, 단계 배지, 칩
  fonts/      Gaegu, Jua, Pretendard, JetBrains Mono (모두 OFL, 라이선스 동봉)
scenes/     계열별 장면: sketch, ui, felt, terminal, set, overlay, bumper
thumbs/     갤러리 카드의 정지 썸네일(장면에서 렌더한 것). build_index.py --thumbs가 다시 만든다
tools/
  capture.py      스틸, 콘택트 시트, mp4, 원본 대조 시트 렌더
  build_index.py  index.html 재생성, 썸네일 재렌더(--thumbs), 장면 메타데이터와 썸네일 점검(--check)
  check_pure.py   모든 장면의 render(t)가 시간의 순수 함수인지 검사
```

## 렌더

```bash
python3 tools/capture.py scenes/ui/flip-counters.html --mp4 out/flip-counters.mp4
```

```bash
python3 tools/capture.py scenes/ui/flip-counters.html --compare out/flip-counters.jpg --n 6
```

두 번째 명령은 원본 프레임(위)과 렌더(아래)를 같은 시각끼리 나란히 붙인다. 원본 영상이 `references/pstack/pstack.mp4`에 있어야 하며, 영상은 저장소에 들어 있지 않다. `pip install playwright pillow`, Google Chrome, ffmpeg가 필요하다. 전체 옵션은 `python3 tools/capture.py --help`.

## 장면 작성 규약

새 장면을 추가하거나 기존 장면을 고칠 때 지키는 것.

1. **`render(t)`는 시간의 순수 함수다.** 어떤 t가 어떤 순서로 들어와도 그 순간의 화면을 처음부터 그린다. 호출 사이에 상태를 두지 않고, `Math.random`·`Date`·CSS 애니메이션과 트랜지션·`requestAnimationFrame`을 쓰지 않는다. 무작위는 `MG.rng`와 `MG.hash`로만. 이 조건이 깨지면 스크럽과 프레임 캡처가 틀린 화면을 낸다.
2. **`ref: [시작초, 끝초]`와 `duration`을 맞춘다.** 장면 시간이 원본 시간과 1:1로 대응해야 `--compare`가 같은 순간을 비교한다.
3. **스크립트 첫 주석에 "무슨 일이 일어나고 어떤 생각을 전달하는가" 2~4문장과 `Motion notes:`를 쓴다.** Motion notes에는 재사용할 기법과 실제로 쓴 수치(이징, 간격, 길이)를 적는다. 나중에 이 주석을 grep해서 장면을 찾는다.
4. **빌드와 네트워크 없이 열려야 한다.** `file://`에서는 ES 모듈이 막히므로 일반 `<script src>`만 쓰고, CDN과 새 의존성을 들이지 않는다.
5. **DOM·SVG 장면은 구조를 `setup`에서 한 번 만들고 `render`에서는 글자·스타일·속성만 갱신한다.** canvas 장면은 매 프레임 전체를 다시 그린다.
6. 고친 뒤에는 `python3 tools/check_pure.py`로 1번을 확인하고, `python3 tools/build_index.py --thumbs`로 썸네일과 색인을 다시 만들고, `--compare`로 원본과 대조한다.

## 원본과 다른 점

- **출처:** 원본은 유튜브 채널 "김플립 - LLM 코딩"의 영상이다. 영상 파일과 거기서 뽑은 프레임은 저장소에 넣지 않았다(`.gitignore`). 모든 그림은 코드로 그린 것이다.
- **바꾼 것:** 자막, 진행자 웹캠, 실제 인물 사진, 브랜드 로고, 책 표지, 웹사이트 스크린샷은 재현하지 않고 중립적인 자리 표시(실루엣, 글자 하나짜리 배지, 뼈대 줄)로 대체했다. 범퍼의 채널 이름은 `YOUR NAME`이다. 화면 속 라벨 문구는 원본 그대로 두었다.
- **충실도:** `ui`, `overlay`, `terminal` 계열은 원본과 구도·타이밍이 가깝다. `sketch`, `felt`, `set` 계열은 비트 순서와 구도는 맞지만 그림 세부(말·건물 같은 복잡한 사물, 펠트 질감)는 원본보다 단순하다. 장면마다 무엇을 단순화했는지는 대조 시트로 확인한다.
