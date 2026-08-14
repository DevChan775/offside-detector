# ⚽🖥️ offside-detector

 > 일반인들도 사용할 수 있는 오프사이드 검출용 VAR 구현

- <img width="535" height="372" alt="image" src="https://github.com/user-attachments/assets/cad8aafa-7584-495d-8c6b-c669bfb62cff" />

## 📖 Description

- 축구 경기 이미지를 이용하여 AI 관절 추적 및 원근감 보정을 거쳐 3D VAR 오프사이드 판정 화면을 시각화하는 프로젝트입니다

## 🖥️ Demo

1. 옵사이드 여부를 판단할 부분의 이미지를 드래그합니다. (test 자료에서는 임의의 선수를 가정)
<img width="1500" height="850" alt="offside_demo_1" src="https://github.com/user-attachments/assets/a5c16a36-4730-4b5b-b485-62b57ce55b67" />


2. 원근감 보정을 위해 4개의 좌표를 찍어줍니다 
<img width="1500" height="850" alt="offside_demo_2" src="https://github.com/user-attachments/assets/b42adbad-bfbb-447c-9254-0691c3c81101" />


3. 만약 선수가 오프사이드를 위반하였다면 빨간 마네킹으로 표시가 됩니다 (아닌 경우 녹색과 파란색으로 구분)

<img width="1500" height="850" alt="offside_demo_3" src="https://github.com/user-attachments/assets/be1e3b1b-4b6d-4209-826a-55e4804eb0d9" />

## :open_file_folder: Project Structure

```markdown
📂 offside-detector
 ├── 📂 backend               # FastAPI 기반 AI 분석 및 판정 백엔드
 │    ├── 📜 main.py          # FastAPI API 엔드포인트 및 CORS 설정
 │    ├── 📜 detector.py      # YOLOv8 Pose 기반 선수 탐지 및 관절 추출
 │    ├── 📜 coordinate.py    # OpenCV 기반 원근감 보정 좌표 변환
 │    ├── 📜 evaluator.py     # 유니폼 색상 클러스터링(KMeans) 및 오프사이드 판정
 │    └── 📜 data_setup.py    # 웹 이미지 바이너리 디코딩
 │
 ├── 📂 frontend              # Next.js / React 기반 3D 인터랙티브 프론트엔드
 │    ├── 📂 app
 │    │    └── 📜 page.tsx    # 전체 파이프라인 상태 관리 메인 페이지
 │    └── 📂 components
 │         ├── 📜 RoiDrawer.tsx     # 마우스 드래그 ROI 관심 영역 지정
 │         ├── 📜 PointDrawer.tsx   # 원근감 보정용 경기장 4지점 클릭
 │         └── 📜 ResultOverlay.tsx # Step 4: Three.js 기반 3D VAR 공간 시각화
 │
 └── 📜 README.md            
```

## 🛠️ Troubleshooting

### 1. YOLO AI 모델 신뢰도(conf) 설정과 관중석 노이즈 간의 트레이드오프 해결
* **문제점:** AI 탐지 신뢰도(conf)를 높이면 필드의 선수를 놓치고, 낮추면 관중석의 사람이나 축구공을 잘못 인식하는 현상 발생
* **원인 분석:** 넓은 경기장 전체 화면에서 관중과 선수의 형상이 겹쳐 AI가 객체를 명확히 구분하기 어려움
* **해결 방안:** 사용자가 오프사이드 판별 영역(ROI)을 직접 마우스 드래그로 지정하도록 UX 개선 (RoiDrawer.tsx). 분석 범위를 제한함으로서 `conf` 값을 높여도 지정 영역 내 선수를 정확히 추출하도록 정밀도 향상

---

### 2. 원근감 보정 시 이미지 찌그러짐으로 인한 AI 인지 불능 문제 해결
* **문제점:** 원근감 보정 행렬을 적용한 후 YOLO를 돌리면, 인물이 심하게 일그러져 AI가 사람을 인식하지 못함
* **해결 방안:** 프로세스의 순서를 역발상으로 전환
  1. 원본 이미지에서 YOLO Pose로 선수 및 신체 관절 좌표를 먼저 추출
  2. 추출된 2D 관절 좌표값에 대해서만 원근감 보정 행렬 연산을 수행하여 좌표 이동 경로만 추적
  * 찌그러진 이미지를 AI에게 다시 분석시킬 필요 없이 정확한 3D 탑뷰 좌표 복원 성공

---

### 3. 단일 카메라 환경의 한계를 고려한 오프사이드 판정 포인트 단순화
* **문제점:** 실제 VAR처럼 완벽히 정밀 복원하려면 다중 카메라시스템이 필요하여 단일 사진 기준 연산에 한계 존재.
* **해결 방안:** 축구 규정상 오프사이드의 기준이 되는 지점 중, 단일 화면에서 가장 명확하게 지면에 밀착되는 **'발 좌표'** 및 **'유효 관절 데이터'** 중심으로 판정 기준선을 단순화하여 연산 안정성 확보

















