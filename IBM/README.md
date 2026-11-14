# IBM

IBM의 손그림 애니메이션 광고 스팟 6편(30초 3편, 15초 3편)에 나오는 모션그래픽을 코드로 다시 만든 레퍼런스다.

- 장면 7개, 5개 계열. 원본에는 약 50개 샷이 있다. 전체 목록과 구현 여부는 [CATALOG.md](CATALOG.md), 계열별 룩과 원본 프레임에서 잰 수치는 [STYLE.md](STYLE.md)에 있다.
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
ink.js   팔레트(IB.C), 붓펜 선과 채움(IB.ink, IB.box, IB.oval, IB.tube), 흑연 음영(IB.shade), 분필 스미어(IB.smear),
         밀려 들어와 멈추는 카피(IB.copy, IB.TYPE), 12fps 양자화(IB.twos), 스피드라인 휩(IB.whip), 날벌레(IB.flyer)
```

## 원본과 다른 점

- **출처:** 원본은 IBM의 광고 스팟이다. 영상 파일과 거기서 뽑은 프레임은 저장소에 넣지 않았다(`.gitignore`). 모든 그림은 코드로 그린 것이다.
- **바꾼 것:** 광고 카피와 태그라인은 같은 줄 수의 한국어 자리 표시 문구로, 로고는 같은 크기에 `LOGO`라고만 적은 자리 표시 상자로, 엔드카드에 내려앉는 벌은 줄무늬 없는 날벌레로 바꿨다. 화면 속 간판과 포스터 글자는 옮기지 않았다. 글꼴은 원본의 IBM Plex Sans 대신 공용 Pretendard 300을 쓰고, 글자 높이·줄 간격·여백은 원본 수치에 맞췄다.
- **충실도:** 구도, 크기, 컷과 비트의 시각, 카피와 카메라의 움직임은 원본 프레임에서 잰 값이다. 그림은 다르다: 원본은 프레임마다 손으로 그린 셀 애니메이션이고, 여기서는 관절 몇 개짜리 리그와 도형으로 단순화했다. `spot/folder-meets-document`와 `endcard/flyby-dot-settle`은 원본과 가깝고, 사람이 나오는 장면(`spot/tandem-riders-join`, `spot/dark-eyes-reveal`, `copy/copy-cards-flashlight`, `insert/mesh-eyes-whip`)은 포즈 수와 얼굴·옷의 세부가 원본보다 훨씬 적다. `establish/city-stadium-flyin`의 도시는 시드로 생성한 것이라 건물 배치가 원본과 다르다. 인물의 전신 연기 샷(카탈로그의 `act`)은 재현하지 않았다.
