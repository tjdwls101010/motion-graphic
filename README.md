# 모션그래픽 레퍼런스 장면

유튜브 영상에 나오는 모션그래픽을 코드로 다시 만든 디자인 레퍼런스 모음이다. 앞으로 클로드로 모션그래픽을 만들 때 "이런 룩, 이런 움직임"을 말로 설명하는 대신 장면 파일을 가리키고 그 코드를 가져다 쓰려는 용도다.

- 영상 하나가 레퍼런스 폴더 하나다. 지금은 [pstack](pstack/README.md)(장면 32개, 7개 계열)이 있다.
- 장면은 전부 빌드 없이 브라우저에서 바로 열리는 HTML이다. 각 장면은 원본의 어느 구간을 재현했는지(`ref`)와 거기서 읽어 낸 모션 규칙(`Motion notes:`)을 파일 안에 적어 둔다.

## 보는 법

```bash
open index.html
```

모든 레퍼런스의 장면이 레퍼런스 → 계열 순으로 한 시트에 모여 있다. 카드에 마우스를 올리면 그 자리에서 장면이 재생되고, 클릭하면 장면이 크게 열린다. 장면을 열면 아래에 재생 막대가 나온다. 스페이스로 재생·정지, 좌우 화살표로 한 프레임씩 이동한다. 주소에 `?t=3.2`를 붙이면 3.2초에서 멈춘 채 열린다.

## 구조

```
index.html  모든 레퍼런스의 장면 시트 (build_index.py가 만든다)
core/       영상과 무관한 공용 엔진. 모든 장면이 불러 쓴다
  motion.js   시간 함수: prog, kf, ease, rng, onTwos, typed
  stage.js    1920x1080 스테이지, 재생 막대, 캡처 훅 (MG.scene)
  base.css    폰트, 스테이지, 재생 막대
  fonts/      Gaegu, Jua, Pretendard, JetBrains Mono (모두 OFL, 라이선스 동봉)
tools/
  library.py      배치 규칙 (아래 <ref>/… 경로). 다른 도구가 이것으로 장면과 영상을 찾는다
  capture.py      스틸, 콘택트 시트, mp4, 원본 대조 시트 렌더
  build_index.py  index.html 재생성, 썸네일 재렌더(--thumbs), 장면 메타데이터와 썸네일 점검(--check)
  check_pure.py   모든 장면의 render(t)가 시간의 순수 함수인지 검사
<ref>/      레퍼런스 영상 하나 (예: pstack/)
  README.md      출처, 원본과 다른 점
  STYLE.md       계열별 룩과 모션 규칙
  CATALOG.md     원본의 샷 전체 목록과 구현 여부
  families.json  계열 이름과 시트 순서 {"계열": "이름", …}
  kit/           이 영상 스타일의 부품
  scenes/<계열>/<장면>.html
  thumbs/<계열>-<장면>.jpg   시트 카드의 정지 썸네일. build_index.py --thumbs가 다시 만든다
references/<ref>/<ref>.mp4   원본 영상. 로컬에만 두고 저장소에 넣지 않는다(.gitignore)
out/                         렌더 결과 작업 공간(.gitignore)
```

## 렌더

```bash
python3 tools/capture.py pstack/scenes/ui/flip-counters.html --mp4 out/flip-counters.mp4
```

```bash
python3 tools/capture.py pstack/scenes/ui/flip-counters.html --compare out/flip-counters.jpg --n 6
```

두 번째 명령은 원본 프레임(위)과 렌더(아래)를 같은 시각끼리 나란히 붙인다. 원본 영상은 장면이 속한 레퍼런스의 `references/<ref>/<ref>.mp4`를 쓰며, 영상은 저장소에 들어 있지 않다. `pip install playwright pillow`, Google Chrome, ffmpeg가 필요하다. 전체 옵션은 `python3 tools/capture.py --help`.

## 레퍼런스 추가

1. 원본 영상을 `references/<ref>/<ref>.mp4`에 둔다.
2. `<ref>/families.json`에 계열을 적고, 장면을 `<ref>/scenes/<계열>/<장면>.html`에 만든다. 엔진은 `../../../core/`에서, 이 영상 스타일의 부품은 `../../kit/`에서 불러온다.
3. `<ref>/README.md`, `STYLE.md`, `CATALOG.md`를 pstack과 같은 모양으로 쓴다.
4. `python3 tools/build_index.py --thumbs`로 썸네일과 시트를 다시 만든다.

## 장면 작성 규약

새 장면을 추가하거나 기존 장면을 고칠 때 지키는 것.

1. **`render(t)`는 시간의 순수 함수다.** 어떤 t가 어떤 순서로 들어와도 그 순간의 화면을 처음부터 그린다. 호출 사이에 상태를 두지 않고, `Math.random`·`Date`·CSS 애니메이션과 트랜지션·`requestAnimationFrame`을 쓰지 않는다. 무작위는 `MG.rng`와 `MG.hash`로만. 이 조건이 깨지면 스크럽과 프레임 캡처가 틀린 화면을 낸다.
2. **`ref: [시작초, 끝초]`와 `duration`을 맞춘다.** 장면 시간이 원본 시간과 1:1로 대응해야 `--compare`가 같은 순간을 비교한다.
3. **스크립트 첫 주석에 "무슨 일이 일어나고 어떤 생각을 전달하는가" 2~4문장과 `Motion notes:`를 쓴다.** 설명 문단은 한국어로 쓰고, 첫 문장이 시트 카드에 그대로 나가므로 그 문장만 읽어도 장면이 무엇인지 알 수 있게 쓴다. Motion notes에는 재사용할 기법과 실제로 쓴 수치(이징, 간격, 길이)를 적고, 이징 이름 같은 기술 용어는 영어 그대로 둔다. 나중에 이 주석을 grep해서 장면을 찾는다.
4. **빌드와 네트워크 없이 열려야 한다.** `file://`에서는 ES 모듈이 막히므로 일반 `<script src>`만 쓰고, CDN과 새 의존성을 들이지 않는다.
5. **DOM·SVG 장면은 구조를 `setup`에서 한 번 만들고 `render`에서는 글자·스타일·속성만 갱신한다.** canvas 장면은 매 프레임 전체를 다시 그린다.
6. 고친 뒤에는 `python3 tools/check_pure.py`로 1번을 확인하고, `python3 tools/build_index.py --thumbs`로 썸네일과 시트를 다시 만들고, `--compare`로 원본과 대조한다.
