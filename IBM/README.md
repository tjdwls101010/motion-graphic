# IBM

IBM의 손그림 애니메이션 광고 스팟 6편(30초 3편, 15초 3편)에 나오는 모션그래픽을 코드로 다시 만든 레퍼런스다.

- 원본을 재현한 장면 6개(4개 계열)와, 같은 스타일로 원본에 없는 상황을 새로 그린 창작 장면 17개(5개 계열)가 있다. 원본에는 약 50개 샷이 있다. 원본 샷의 전체 목록과 구현 여부는 [CATALOG.md](CATALOG.md), 계열별 룩과 원본 프레임에서 잰 수치, 창작 계열의 규칙은 [STYLE.md](STYLE.md)에 있다.
- 계열 이름과 시트에서의 순서는 [families.json](families.json)에 있다.

## 원본 영상

도구는 레퍼런스마다 영상 한 파일(`references/IBM/IBM.mp4`)을 기대하는데 원본은 여섯 파일이라, 순서대로 이어 붙여 24fps 1920x1080 한 파일로 만들어 쓴다. 장면의 `ref`와 카탈로그의 시각은 전부 이 파일 기준이다. `references/IBM/`에 `video1.mp4`부터 `video6.mp4`까지 둔 뒤 그 폴더에서 한 번 실행한다.

```bash
ffmpeg -i video1.mp4 -i video2.mp4 -i video3.mp4 -i video4.mp4 -i video5.mp4 -i video6.mp4 -filter_complex "[0:v]fps=24,scale=1920:1080,setsar=1[a];[1:v]fps=24,scale=1920:1080,setsar=1[b];[2:v]fps=24,scale=1920:1080,setsar=1[c];[3:v]fps=24,scale=1920:1080,setsar=1[d];[4:v]fps=24,scale=1920:1080,setsar=1[e];[5:v]fps=24,scale=1920:1080,setsar=1[f];[a][b][c][d][e][f]concat=n=6:v=1:a=0[v]" -map "[v]" -c:v libx264 -crf 16 -preset fast -pix_fmt yuv420p IBM.mp4
```

결과는 135.08초(3242프레임)이고 각 편은 0.00, 30.08, 60.08, 90.08, 105.08, 120.08초에서 시작한다. 원본 네 편이 23.976fps라 24fps로 맞추면서 1편에 프레임 하나가 더해졌다.

## 스타일 부품 (`kit/`)

장면에 보이는 것은 전부 여기 있는 부품이다: 캐릭터, 소품, 배경 세트, 효과 표시, 박자 도구. 장면 파일에는 데이터 표(포즈, 박자, 배치)와 조립 순서만 있고, 모양을 직접 그리는 코드는 없다. 새 장면도 그렇게 만든다: 부품을 고르고, 가장 가까운 장면의 표를 가져오고, 모자란 그림은 장면이 아니라 여기에 부품으로 더한다.

전부 2D canvas에 그리고, 입체도 3D 렌더러 없이 투영한 점을 같은 붓펜으로 그린다. 장면은 공용 엔진(`../core/`) 다음에 `ink.js`, `time.js`를 부르고, 그 뒤로 쓰는 파일만 `<script src>`로 나열한다(순서: `marks.js`, `figure.js`, `solid.js`, 그다음 `cast/`·`props/`·`sets/`). 부품마다 머리 주석에 무엇인지, 기준점, 상태 필드, 쓰는 장면이 적혀 있다.

```
ink.js     붓펜 선과 질감: 팔레트(IB.C), 선과 채움(IB.ink, IB.box, IB.oval, IB.seg, IB.tube, IB.pipe), 흑연 음영(IB.shade), 분필 스미어(IB.smear),
           화면 자르기(IB.crop, IB.clipRect), 점 목록 도구(IB.ellipse, IB.rect, IB.along, IB.mirror), 스피드라인 휩(IB.whip), 날벌레(IB.flyer),
           밀려 들어와 멈추는 카피(IB.copy, IB.TYPE)
time.js    시계와 그림 목록: 12fps·8fps 양자화(IB.twos, IB.threes), 프레임 번호(IB.frame), 정착 곡선(IB.settle), 12fps 격자(IB.T, IB.drawn),
           그림 목록 조회(IB.held, IB.heldRow), 동작을 표에 끼워 넣기(IB.play), 사이 그림 비율(IB.inbetween), 두 장 교대(IB.alternate), 순환(IB.loop)
marks.js   효과 표시: 터짐선(IB.burst), 쿵(IB.thud), 입김(IB.breath), 연기(IB.smoke), 물방울과 튐(IB.drop, IB.splash), 어둠과 빛줄기(IB.darkness, IB.lightBeam),
           휩에 뜯기는 화면(IB.whipBreakup), 문지른 흑연(IB.smudge), 신발 밑 웅덩이(IB.puddle), 바퀴 밑 물결선과 먼지(IB.ripples, IB.wheelDust)
figure.js  옆모습 인물 리그(IB.figure, IB.stand, IB.walk, IB.poseMix, IB.footLift, 비례는 IB.FIG), 다리 달린 사물의 팔다리와 손(IB.peg, IB.hose, IB.boot, IB.mitt, IB.clasp),
           화면 밖에서 온 손과 팔(IB.pointer, IB.reachArm), 말풍선(IB.bubble), 흔들림선(IB.shake)
solid.js   입체로 도는 사물: 3D 좌표를 투영해 붓펜으로 그린다(IB.space, IB.cast), 휘는 종이(IB.bend, IB.rim), 틈의 흑연(IB.crease, IB.clip)
cast/      캐릭터. 그림 함수와 함께 이름 붙은 포즈(POSE)와 동작(MOVE: 그 동작의 첫 그림부터 센 [프레임, 포즈] 목록)을 내보낸다
  people.js   IB.figure에 입히는 고정 출연진(IB.PEOPLE: chopper, lifter, walker, climber, neighbour, searcher, kid, passenger, trader, typist, lounger)과 군중(IB.PASSERSBY)
  paper.js    폴더와 서류(IB.folder, IB.doc, 둘의 팔 IB.paperArm, IB.reachArms, IB.paperClasp), 숨는 서류(IB.hidingDoc, IB.docEyes)
  parcel.js   다리 달린 소포(IB.parcel)
  riders.js   탠덤의 다섯 사람(IB.rider, IB.RIDERS), 날아가는 모자(IB.flyingCap)
  watcher.js  쌍안경 관찰자(IB.watcher), 암전 속 두 눈(IB.darkEyes)
  cat.js      창가 고양이(IB.windowCat), 의자 위 고양이(IB.chairCat)
  closeup.js  철망 너머 두 얼굴(IB.boldFace, IB.worriedFace), 철망(IB.maskMesh), 인서트의 줌과 기울기(IB.closeup)
props/     소품
  nature.js   화분(IB.pottedPlant, IB.PLANTS), 창턱 화분(IB.sillPlant), 구름 셋(IB.cloud, IB.bandCloud, IB.wispCloud), 나무 덩어리(IB.clump), 새(IB.bird), 풀과 돌(IB.tuft, IB.stones)
  home.js     식탁 의자(IB.diningChair), 케이크 식탁과 초(IB.partyTable, IB.candle), 펜던트 등(IB.hangingLamp), 나무 상자(IB.woodCrate), 문(IB.door), 액자(IB.pictureFrame),
              트로피 장식장(IB.trophyCabinet), 교차한 검(IB.crossedFoils), 호출 버튼(IB.callButton)
  handheld.js 도끼와 그루터기·장작(IB.axe, IB.choppingBlock, IB.logHalf, IB.logTop, IB.woodChip), 손전등(IB.torch), 호스·노즐·물줄기(IB.gardenHose, IB.nozzle, IB.waterJet),
              종이 상자(IB.cardboardBox), 전화기(IB.handset, IB.phone), 컵(IB.cup, IB.smallCup, IB.strawCup), 가방과 끈(IB.slingBag, IB.strap, IB.briefcase)
  party.js    풍선(IB.balloon, IB.looseBalloon, IB.heartBalloon), 미러볼(IB.discoBall), 색종이(IB.confettiField, IB.confetti)
  vehicles.js 헬리콥터(IB.heli, IB.heliFront, IB.rotor, IB.heliDrawing), 탠덤(IB.tandem, IB.bikeWheel, IB.crankset), 택시(IB.cab), 종이비행기(IB.paperPlane),
              롤러코스터(IB.rail, IB.coasterTrack, IB.coasterCart), 컨베이어와 스탬프 기계(IB.conveyor, IB.stamper)
  office.js   앉은 포즈(IB.sit), 의자·책상·모니터·자리(IB.chair, IB.desk, IB.monitor, IB.workstation, IB.keyboard), 캔들 차트와 선 차트(IB.candles, IB.lineChart, IB.priceGrid, IB.chartAxes,
              IB.dashLine, IB.candleSmear, IB.priceTag), 커서와 팝업(IB.cursor, IB.popupTag), 화살표(IB.arrow), 벽시계(IB.wallClock), 전화 받침(IB.phoneCradle), 날리는 종이(IB.flyingSheet)
  metaphor.js 막대(IB.bar), 깃발(IB.flag), 도미노(IB.domino, IB.dominoRest), 낭떠러지와 널빤지(IB.ledge, IB.plank)
sets/      배경 세트. 조각은 props를 쓰고 배치는 세트의 데이터다. `layer`로 나눠 그려서 배우가 그 사이에 선다
  city.js     도시와 경기장(IB.stadiumCity, IB.stadium, IB.tower, IB.roofBlock)
  street.js   금융가 거리(IB.financeStreet, IB.windowGrid)
  corridor.js 원근 복도(IB.corridor)
  facade.js   건물 정면의 두 창과 방(IB.apartmentFacade, IB.windowFrame, IB.sashAndSill)
  party.js    파티 구석(IB.partyCorner)
  trading.js  시세판(IB.tickerBoard)
```

부품을 쓰는 규칙은 다음과 같다.

- **호출 모양은 `IB.<이름>(ctx, 기준점, 상태, 옵션)`이다.** 기준점은 서 있는 것이면 바닥에 닿는 가운데, 떠 있는 것이면 중심이고, 정확히 어디인지는 머리 주석에 있다. `seed`의 기본값은 원래 장면이 쓰던 값이라, 같은 부품을 한 화면에 둘 놓을 때는 `seed`를 달리 준다.
- **원본에서 좌표째 옮긴 그림은 원본의 무대 좌표로 그린다.** 폴더와 서류, 관찰자와 창가 고양이, 철망 얼굴, 도시·거리·건물 정면이 그렇다. 다른 자리에 놓으려면 `shift` 옵션을 주거나 컨텍스트를 옮긴다(`ctx.translate`).
- **연기는 `[프레임, 포즈]` 표로 적고 `IB.held`로 읽는다.** 캐릭터의 `MOVE`는 그 표의 조각이다: `[[0, POSE.front], ...IB.play(IB.folder.MOVE.kick, 18)]`처럼 시작 프레임에 끼워 넣는다. 다음 키까지가 그대로 정지 구간이다.
- **장면에 남는 것은 표와 조립뿐이다.** 아래 명령의 출력이 0줄이어야 한다. `IB.smear`, `IB.shade`, `IB.shake`, `IB.flyer`, `IB.figure`, `IB.bubble`처럼 이름 붙은 부품을 장면이 놓는 것은 조립이다.

```bash
grep -rnE "IB\.(ink|box|oval|seg|tube|ellipse|limb|peg|hose|boot|mitt|clasp|crease)\(|ctx\.(fill|stroke|fillRect|strokeRect|arc|ellipse|quadraticCurveTo|bezierCurveTo|fillText)\(" IBM/scenes
```

## 창작 장면

`metaphor`, `acting`, `vignette`, `variation`, `market` 다섯 계열은 원본의 샷이 아니다. 원본의 룩과 모션 원칙을 지키면서 다른 상황을 새로 그렸고, 장면은 `ref: null`이라 시트에 "창작"으로 나오며 `tools/capture.py --compare`를 쓸 수 없다. 인물의 그림체는 `references/IBM/`에 둔 제작 스틸 7장(로컬에만 있다)도 참고했다. 원본에 없던 글자가 두 가지 있다. 일부 장면의 말풍선(한국어 한마디, 규칙은 STYLE.md의 "말풍선")과 `variation/hose-wipe-endcard`의 엔드카드 한 줄(원본 태그라인이 아닌 자리 표시 문구)이다.

## 원본과 다른 점

- **출처:** 원본은 IBM의 광고 스팟이다. 영상 파일과 거기서 뽑은 프레임은 저장소에 넣지 않았다(`.gitignore`). 모든 그림은 코드로 그린 것이다.
- **바꾼 것:** 문구는 전부 뺐다. 광고 카피, 태그라인, 로고, 화면 속 간판과 포스터 글자를 그리지 않는다. 카피가 왼쪽을 차지하던 스팟 장면은 그림이 있는 영역만 16:9로 잘라 화면에 채웠다(영역은 각 장면의 `CROP`, 좌표는 원본 기준 그대로). 그래서 `tools/capture.py --compare`는 이 세 장면에서 `--ref-crop`에 장면의 `CROP`(x,y,w,h)을 주어야 크기와 위치가 맞는다: 주지 않으면 잘리지 않은 원본 프레임이 잘린 렌더 위에 놓인다. 엔드카드에 내려앉는 벌은 줄무늬 없는 날벌레로, 헬리콥터 옆면의 브랜드 표식은 빈 면으로 바꿨다. 카피의 글꼴 수치는 kit의 `IB.TYPE`에 남아 있고, 글꼴은 원본의 IBM Plex Sans 대신 공용 Pretendard 300을 쓰게 되어 있다.
- **충실도:** 구도, 크기, 컷과 비트의 시각, 카피와 카메라의 움직임은 원본 프레임에서 잰 값이다. 그림은 다르다: 원본은 프레임마다 손으로 그린 셀 애니메이션이고, 여기서는 원본 확대 크롭에서 읽은 형태를 닫힌 도형과 관절 몇 개짜리 리그로 옮겼다. 장면별로 보면 `endcard/flyby-dot-settle`은 확대해도 원본과 가깝다. `spot/folder-meets-document`는 원본을 프레임 단위로 뽑아 그림 수(배우마다 약 50장)와 그림의 종류(폴더의 뒤돌기와 벌어짐, 종이의 휨과 메모지, 굽는 다리, 손가락 있는 손)를 맞췄지만 원본의 그림을 한 장씩 옮긴 것은 아니다. 폴더가 뒤도는 순간의 공중 그림 한 장과 미러볼의 회전은 원본에 없는 것을 같은 문법으로 넣었고, 폴더의 스텝 그루브, 서류의 빠른 회전, 서류가 폴더를 지켜보다 런지에 몸을 젖히는 대목은 원본에도 있는 연기를 다른 그림으로 다시 그렸다(원본의 서류는 이때 좌우가 뒤집힌 그림으로 돌아서지만 여기서는 4분의 3쯤만 몸을 튼다). `spot/tandem-riders-join`의 인물은 원본에서 읽은 관절 위치에 옷과 옆얼굴을 입힌 리그다. 다섯 사람의 차림과 머리 모양, 그림마다의 자세(기울기, 안장에서 뜨는 높이, 팔, 고개, 눈과 입, 머리카락의 솟음)는 원본의 합류와 피날레를 따라 넣었지만 옷 주름과 손가락, 원본의 그림 한 장 한 장의 선은 없다. 합류할 때 새 사람이 원본에서는 앞사람 뒤에서 갈라져 나오듯 나타나는데 여기서는 위에서 떨어져 앉고, 모자를 잃은 사람이 마지막에 남들처럼 팔을 드는 것은 원본에 없다. `spot/dark-eyes-reveal`은 관찰자와 고양이의 그림을 원본의 4배 확대 격자에서 옮겼고, 둘의 연기(렌즈 속 눈의 움직임과 고개 돌리기, 쌍안경을 내리는 넉 장, 고양이가 창턱 아래로 사라졌다 자기 쌍안경을 들고 올라오는 개그)를 원본의 프레임에 맞춰 넣었다. 고양이의 귀 까딱임과 꼬리 흔들기는 원본이 2프레임마다 조금씩 다시 그리는 것을 몇 장으로 줄였고(창턱을 떠나는 그림도 원본 다섯 장을 넉 장으로), 화분의 잎은 시드로 뿌린 것이라 원본의 배치와 다르며 흔들림도 세 장을 돌리는 것이다. 고개를 돌릴 때 원본은 머리와 쌍안경을 돌려 그린 새 그림이고 여기서는 옮기고 오른쪽 경통의 옆면을 덧그린 것이다. 끝에 날아드는 벌은 줄무늬 없는 날벌레다. `insert/mesh-eyes-whip`의 두 얼굴은 원본의 눈·눈썹·코·주근깨의 형태를 100px 격자에서 읽어 옮겼고, 찌푸렸다 돌아 나오는 고개, 가늘게 떴다 커지는 눈, 걱정스럽게 올라가는 눈썹, 자라는 땀방울을 원본이 그림을 바꾸는 프레임에 맞췄다. 표정의 중간 그림은 원본처럼 새로 그린 것이 아니라 눈썹과 눈꺼풀을 옮긴 것이다. `establish/city-stadium-flyin`은 경기장, 고층 건물 스물두 채의 위치·높이·창 무늬가 놓인 자리, 전경 건물, 구름과 새를 원본의 100px 격자에서 읽어 옮겼고, 헬리콥터는 그림 열아홉 장의 위치·크기·기울기를 원본의 노란 면적에서 재서 놓았다(14프레임 이후 중심이 원본과 5px 안). 건물 사이를 메운 나무는 손으로 놓은 타원 안에서 생성한 것이라 혹 하나하나는 원본과 다르고, 전경 건물은 원본의 계단식 지붕을 사각 지붕으로 줄였다. 헬리콥터는 옆모습과 정면 두 가지 그림뿐이라, 렌즈 앞을 지나는 첫 석 장과 돌아선 뒤의 비스듬한 그림들은 원본처럼 그 각도로 새로 그린 것이 아니라 옆모습을 키우고 돌린 것이며, 옆면의 눈 그림과 글자는 뺐다. 인물의 전신 연기 샷(카탈로그의 `act`)과 카피 카드(`copy`)는 장면으로 두지 않았다.
