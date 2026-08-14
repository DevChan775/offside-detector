# ⚽🖥️ offside-detector

 > 일반인들도 사용할 수 있는 오프사이드 검출용 VAR 구현

- 사진 삽입 부분

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


















