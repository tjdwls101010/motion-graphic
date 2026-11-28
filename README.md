# 모션그래픽 레퍼런스 장면

유튜브 영상에 나오는 모션그래픽을 코드로 다시 만든 디자인 레퍼런스 모음이다. 앞으로 클로드로 모션그래픽을 만들 때 "이런 룩, 이런 움직임"을 말로 설명하는 대신 장면 파일을 가리키고 그 코드를 가져다 쓰려는 용도다.

- 영상 하나가 레퍼런스 폴더 하나다. 지금은 [IBM](IBM/README.md)(장면 59개, 15개 계열: 재현 6개와 같은 스타일의 창작 53개, 그리고 kit 부품 견본 74장)이 있다.
- 장면은 전부 빌드 없이 브라우저에서 바로 열리는 HTML이다. 각 장면은 원본의 어느 구간을 재현했는지(`ref`)와 거기서 읽어 낸 모션 규칙(`Motion notes:`)을 파일 안에 적어 둔다.

## 보는 법

```bash
open index.html
```

모든 레퍼런스의 장면이 레퍼런스 → 계열 순으로 한 시트에 모여 있다. 위쪽 링크의 `parts.html`(부품 시트)에는 장면을 조립하는 kit 부품이 묶음별 견본 페이지로 모여 있다. 칸마다 부품과 그 상태를 장면과 같은 크기로 그리고, 포즈와 동작을 반복 재생한다. 카드에 마우스를 올리면 그 자리에서 장면이 재생되고, 클릭하면 장면이 크게 열린다. 장면을 열면 아래에 재생 막대가 나온다. 스페이스로 재생·정지, 좌우 화살표로 한 프레임씩 이동한다. 주소에 `?t=3.2`를 붙이면 3.2초에서 멈춘 채 열린다.

## 구조

```
index.html  모든 레퍼런스의 장면 시트 (build_index.py가 만든다)
parts.html  모든 레퍼런스의 부품 시트: <ref>/parts/의 견본 카드 (build_index.py가 만든다)
core/       영상과 무관한 공용 엔진. 모든 장면이 불러 쓴다
  motion.js   시간 함수: prog, kf, ease, rng, onTwos, typed
  stage.js    1920x1080 스테이지, 재생 막대, 캡처 훅 (MG.scene)
  base.css    폰트, 스테이지, 재생 막대
  fonts/      Gaegu, Jua, Pretendard, JetBrains Mono (모두 OFL, 라이선스 동봉)
tools/
  library.py      배치 규칙 (아래 <ref>/… 경로). 다른 도구가 이것으로 장면과 영상을 찾는다
  capture.py      스틸, 콘택트 시트, mp4, 원본 대조 시트 렌더
  build_index.py  index.html과 parts.html 재생성, 썸네일 재렌더(--thumbs), 장면·견본 메타데이터와 썸네일 점검(--check)
  check_pure.py   모든 장면과 견본의 render(t)가 시간의 순수 함수인지 검사
  drawings.py     장면의 IB.actors(t)로 배우마다 그림 수를 센다: 그림이 바뀌는 프레임, 움직이는 동안의 초당 그림 수, 가장 긴 정지, 스텝보다 오래 남은 그림. 연기 업그레이드의 수치 근거
  same_frames.py  장면이 다른 트리(예: 고치기 전 커밋)와 모든 프레임에서 픽셀 하나 다르지 않게 그려지는지 검사. 동작을 바꾸지 않는 구조 변경의 증거
  test_*.py, test_*.js  도구와 부품의 계약 테스트. test_kit.js는 <ref>/kit/ 파일의 의존(Needs), 장면과 견본의 불러오기, 캐릭터 MOVE의 모양, kit의 모든 부품이 어느 견본에 그려지는지를 브라우저 없이 확인한다
<ref>/      레퍼런스 영상 하나 (예: IBM/)
  README.md      출처, 원본과 다른 점
  STYLE.md       계열별 룩과 모션 규칙
  CATALOG.md     원본의 샷 전체 목록과 구현 여부
  families.json  계열 이름과 시트 순서 {"계열": "이름", …}
  kit/           이 영상 스타일의 부품: 선과 박자 도구, 캐릭터(cast/), 소품(props/), 배경 세트(sets/). 장면은 이것을 조립만 한다
  scenes/<계열>/<장면>.html
  parts/<묶음>/<이름>.html   kit 부품 견본(묶음: look, cast, props, sets, marks, time). ref: null인 MG.scene이고, 첫 주석의 첫 문장이 부품 시트의 카드 글이다
  parts/sample.js            견본 페이지의 칸 배치 도우미(전역 SAMPLE). 부품이 아니라 페이지를 그린다
  thumbs/<계열>-<장면>.jpg   시트 카드의 정지 썸네일. 견본은 parts-<묶음>-<이름>.jpg. build_index.py --thumbs가 다시 만든다
references/<ref>/<ref>.mp4   원본 영상. 로컬에만 두고 저장소에 넣지 않는다(.gitignore)
out/                         렌더 결과 작업 공간(.gitignore)
```

## 렌더

```bash
python3 tools/capture.py IBM/scenes/spot/folder-meets-document.html --mp4 out/folder.mp4
```

```bash
python3 tools/capture.py IBM/scenes/spot/folder-meets-document.html --compare out/folder.jpg --n 6
```

두 번째 명령은 원본 프레임(위)과 렌더(아래)를 같은 시각끼리 나란히 붙인다. 고르게 뽑은 시점은 구도를 보여 줄 뿐 그림 한 장 한 장은 놓치므로, 연기를 볼 때는 `--frames 16-36`으로 프레임을 짚고 `--box x0,y0,x1,y1`로 배우만 확대한다(원본의 일부만 잘라 보여 주는 장면은 `--ref-crop`에 그 영역을 준다). 키의 시각이나 위치를 재려고 원본 프레임을 직접 뽑을 때는 시각(`-ss`)이 아니라 프레임 번호로 뽑는다: `ffmpeg -i references/<ref>/<ref>.mp4 -vf "select=between(n\,157\,211)" -fps_mode passthrough -start_number 0 out/ref/%03d.png`(157은 장면의 `ref` 시작초 x 24). `-ss`는 요청한 시각과 같거나 그 뒤의 첫 프레임부터 주기 때문에 시작초의 반올림에 따라 전체가 한 프레임 밀리고, 2프레임마다 한 장인 그림에서는 그 한 프레임이 키를 전부 홀짝이 바뀐 자리에 놓게 만든다. 원본 영상은 장면이 속한 레퍼런스의 `references/<ref>/<ref>.mp4`를 쓰며, 영상은 저장소에 들어 있지 않다. `pip install playwright pillow`, Google Chrome, ffmpeg가 필요하다. 전체 옵션은 `python3 tools/capture.py --help`.

## 레퍼런스 추가

1. 원본 영상을 `references/<ref>/<ref>.mp4`에 둔다.
2. `<ref>/families.json`에 계열을 적고, 장면을 `<ref>/scenes/<계열>/<장면>.html`에 만든다. 엔진은 `../../../core/`에서, 이 영상 스타일의 부품은 `../../kit/`에서 불러온다. 여러 장면에 다시 쓸 그림(캐릭터, 소품, 배경)은 장면이 아니라 `kit/`에 부품으로 두고, 장면에는 포즈·박자·배치의 표와 조립만 남긴다(IBM이 그 예다: `IBM/README.md`의 부품 지도).
3. `<ref>/README.md`, `STYLE.md`, `CATALOG.md`를 IBM과 같은 모양으로 쓴다.
4. `python3 tools/build_index.py --thumbs`로 썸네일과 시트를 다시 만든다.

## 장면 작성 규약

새 장면을 추가하거나 기존 장면을 고칠 때 지키는 것.

1. **`render(t)`는 시간의 순수 함수다.** 어떤 t가 어떤 순서로 들어와도 그 순간의 화면을 처음부터 그린다. 호출 사이에 상태를 두지 않고, `Math.random`·`Date`·CSS 애니메이션과 트랜지션·`requestAnimationFrame`을 쓰지 않는다. 무작위는 `MG.rng`와 `MG.hash`로만. 이 조건이 깨지면 스크럽과 프레임 캡처가 틀린 화면을 낸다.
2. **`ref: [시작초, 끝초]`와 `duration`을 맞춘다.** 장면 시간이 원본 시간과 1:1로 대응해야 `--compare`가 같은 순간을 비교한다. 원본에 없는 상황을 그 레퍼런스의 스타일로 새로 그린 창작 장면은 대응 구간이 없으므로 `ref: null`이라고 적는다: 시트 카드에 구간 대신 "창작"이 나오고 `--compare`는 쓸 수 없다. `ref`를 아예 빼면 `build_index.py --check`가 빠뜨린 것으로 본다.
3. **스크립트 첫 주석에 "무슨 일이 일어나고 어떤 생각을 전달하는가" 2~4문장과 `Motion notes:`를 쓴다.** 설명 문단은 한국어로 쓰고, 첫 문장이 시트 카드에 그대로 나가므로 그 문장만 읽어도 장면이 무엇인지 알 수 있게 쓴다. Motion notes에는 재사용할 기법과 실제로 쓴 수치(이징, 간격, 길이)를 적고, 이징 이름 같은 기술 용어는 영어 그대로 둔다. 나중에 이 주석을 grep해서 장면을 찾는다.
4. **빌드와 네트워크 없이 열려야 한다.** `file://`에서는 ES 모듈이 막히므로 일반 `<script src>`만 쓰고, CDN과 새 의존성을 들이지 않는다.
5. **DOM·SVG 장면은 구조를 `setup`에서 한 번 만들고 `render`에서는 글자·스타일·속성만 갱신한다.** canvas 장면은 매 프레임 전체를 다시 그린다.
6. 고친 뒤에는 `python3 tools/check_pure.py`로 1번을 확인하고, `python3 tools/build_index.py --thumbs`로 썸네일과 시트를 다시 만들고, `--compare`로 원본과 대조한다. 그림을 바꾸지 않으려는 변경(코드를 부품으로 옮기기 등)이면 고치기 전 커밋을 `rm -rf out/base && mkdir -p out/base && git archive <커밋> | tar -x -C out/base`로 풀고 `python3 tools/same_frames.py --base out/base IBM/scenes/*/*.html`처럼 바꾼 장면을 지정해 모든 프레임이 그대로인지 확인한다. 정확 비교라 canvas 장면에만 쓴다: SVG 필터를 쓰는 장면(지금은 지운 pstack의 felt 장면)은 같은 파일이어도 텍스처 잡음으로 실패한다.
