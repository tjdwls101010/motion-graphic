# IBM

IBM의 손그림 애니메이션 광고 스팟 6편(30초 3편, 15초 3편)에 나오는 모션그래픽을 코드로 다시 만든 레퍼런스다.

- 원본을 재현한 장면 6개(4개 계열)와, 같은 스타일로 원본에 없는 상황을 새로 그린 창작 장면 6개(4개 계열)가 있다. 원본에는 약 50개 샷이 있다. 원본 샷의 전체 목록과 구현 여부는 [CATALOG.md](CATALOG.md), 계열별 룩과 원본 프레임에서 잰 수치, 창작 계열의 규칙은 [STYLE.md](STYLE.md)에 있다.
- 계열 이름과 시트에서의 순서는 [families.json](families.json)에 있다.

## 원본 영상

도구는 레퍼런스마다 영상 한 파일(`references/IBM/IBM.mp4`)을 기대하는데 원본은 여섯 파일이라, 순서대로 이어 붙여 24fps 1920x1080 한 파일로 만들어 쓴다. 장면의 `ref`와 카탈로그의 시각은 전부 이 파일 기준이다. `references/IBM/`에 `video1.mp4`부터 `video6.mp4`까지 둔 뒤 그 폴더에서 한 번 실행한다.

```bash
ffmpeg -i video1.mp4 -i video2.mp4 -i video3.mp4 -i video4.mp4 -i video5.mp4 -i video6.mp4 -filter_complex "[0:v]fps=24,scale=1920:1080,setsar=1[a];[1:v]fps=24,scale=1920:1080,setsar=1[b];[2:v]fps=24,scale=1920:1080,setsar=1[c];[3:v]fps=24,scale=1920:1080,setsar=1[d];[4:v]fps=24,scale=1920:1080,setsar=1[e];[5:v]fps=24,scale=1920:1080,setsar=1[f];[a][b][c][d][e][f]concat=n=6:v=1:a=0[v]" -map "[v]" -c:v libx264 -crf 16 -preset fast -pix_fmt yuv420p IBM.mp4
```

결과는 135.08초(3242프레임)이고 각 편은 0.00, 30.08, 60.08, 90.08, 105.08, 120.08초에서 시작한다. 원본 네 편이 23.976fps라 24fps로 맞추면서 1편에 프레임 하나가 더해졌다.

## 스타일 부품 (`kit/`)

장면은 공용 엔진(`../core/`) 위에 이 부품을 `<script src>`로 불러 쓴다. 전부 canvas에 그린다.

```
ink.js   팔레트(IB.C), 화면 자르기(IB.crop), 붓펜 선과 채움(IB.ink, IB.box, IB.oval, IB.tube), 흑연 음영(IB.shade), 분필 스미어(IB.smear),
         12fps 양자화(IB.twos), 스피드라인 휩(IB.whip), 날벌레(IB.flyer),
         밀려 들어와 멈추는 카피(IB.copy, IB.TYPE: 지금 장면에서는 쓰지 않는다)
figure.js 옆모습 인물 리그(IB.figure, IB.stand, IB.poseMix, IB.footLift, 비례는 IB.FIG), 다리 달린 사물의 다리(IB.peg),
         말풍선(IB.bubble), 흔들림선(IB.shake). 창작 장면이 쓴다
```

## 창작 장면

`metaphor`, `acting`, `vignette`, `variation` 네 계열은 원본의 샷이 아니다. 원본의 룩과 모션 원칙을 지키면서 다른 상황을 새로 그렸고, 장면은 `ref: null`이라 시트에 "창작"으로 나오며 `tools/capture.py --compare`를 쓸 수 없다. 인물의 그림체는 `references/IBM/`에 둔 제작 스틸 7장(로컬에만 있다)도 참고했다. 원본에 없던 말풍선이 일부 장면에 있다: 한국어 한마디이고 규칙은 STYLE.md의 "말풍선"에 있다.

## 원본과 다른 점

- **출처:** 원본은 IBM의 광고 스팟이다. 영상 파일과 거기서 뽑은 프레임은 저장소에 넣지 않았다(`.gitignore`). 모든 그림은 코드로 그린 것이다.
- **바꾼 것:** 문구는 전부 뺐다. 광고 카피, 태그라인, 로고, 화면 속 간판과 포스터 글자를 그리지 않는다. 카피가 왼쪽을 차지하던 스팟 장면은 그림이 있는 영역만 16:9로 잘라 화면에 채웠다(영역은 각 장면의 `CROP`, 좌표는 원본 기준 그대로). 그래서 `tools/capture.py --compare`는 이 세 장면에서 잘리지 않은 원본 프레임을 잘린 렌더 위에 놓는다: 시각은 맞지만 크기와 위치는 원본 프레임을 같은 `CROP`으로 잘라야 맞는다. 엔드카드에 내려앉는 벌은 줄무늬 없는 날벌레로, 헬리콥터 옆면의 브랜드 표식은 빈 면으로 바꿨다. 카피의 글꼴 수치는 kit의 `IB.TYPE`에 남아 있고, 글꼴은 원본의 IBM Plex Sans 대신 공용 Pretendard 300을 쓰게 되어 있다.
- **충실도:** 구도, 크기, 컷과 비트의 시각, 카피와 카메라의 움직임은 원본 프레임에서 잰 값이다. 그림은 다르다: 원본은 프레임마다 손으로 그린 셀 애니메이션이고, 여기서는 원본 확대 크롭에서 읽은 형태를 닫힌 도형과 관절 몇 개짜리 리그로 옮겼다. 장면별로 보면 `endcard/flyby-dot-settle`과 `spot/folder-meets-document`는 확대해도 원본과 가깝다. `spot/tandem-riders-join`의 인물은 원본에서 읽은 관절 위치에 옷 실루엣과 옆얼굴을 입힌 리그라 실루엣은 대응하지만 표정, 옷 주름, 사람마다 다른 자세와 손짓은 없다. `spot/dark-eyes-reveal`은 스웨터 실루엣·방 안 소품·화분이 원본 형태를 따르지만 내린 쌍안경이 정면 렌즈 두 개이고 고양이의 개그가 빠졌다. `insert/mesh-eyes-whip`의 얼굴은 기준선 그대로의 단순한 대역이다. `establish/city-stadium-flyin`은 경기장, 전경 건물, 나무 줄, 헬리콥터가 원본의 배치와 형태를 따르지만 뒤쪽 고층 건물은 시드로 생성한 것이라 원본과 다르고, 헬리콥터 옆면의 브랜드 표식과 글자는 뺐다. 인물의 전신 연기 샷(카탈로그의 `act`)과 카피 카드(`copy`)는 장면으로 두지 않았다.
