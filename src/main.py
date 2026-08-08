from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import cv2
import json

from data_setup import process_web_image
from detector import detect_players_with_roi, extract_person_keypoints
from coordinate import get_perspective_matrix, transform_all_keypoints
from evaluator import evaluate_offside

app = FastAPI()

# 웹 브라우저(프론트엔드)와의 통신을 허용하는 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_methods = ["*"],
    allow_headers = ["*"],
)

@app.post("/analyze-offside")
async def analyze_offside(file: UploadFile = File(...), roi: str = Form(...), points: str = Form(...)):
    # 1. 파일 데이터 읽기
    contents = await file.read()
    img = process_web_image(contents)

    # 2. ROI 정보 파싱
    roi_data = json.loads(roi) # [x, y, w, h]
    points_data = json.loads(points) 

    # 3. 오프사이드 판별 엔진 가동
    result, crop_x, crop_y = detect_players_with_roi(img, roi_data)

    # original_kpts: 확인된 모든 선수의 관절 좌표가 정리되어 있음
    original_kpts = extract_person_keypoints(result, offset_x = crop_x, offset_y = crop_y)

    # matrix: 원근감을 보정하기 위한 점 이동 규칙이 수치로 존재함 
    matrix, _ = get_perspective_matrix(img, points_data)

    # top_down_kpts: 모든 선수들의 좌표가 원근감이 보정되어 저장됨
    top_down_kpts = transform_all_keypoints(original_kpts, matrix)
    line_x, offside_players, all_players_data = evaluate_offside(img, original_kpts, top_down_kpts)
    
    # 4. JSON 결과 반환
    return {"offside_line": line_x, "players": offside_players, "all_players_data": all_players_data}   



@app.post("/get-coordinates")
async def get_coordinates(file: UploadFile = File(...), roi: str = Form(...)):
    # 1. 프론트엔드에서 보낸 사진과 드래그 영역(ROI) 데이터를 읽어옴
    contents = await file.read()
    img = process_web_image(contents)
    roi_data = json.loads(roi)

    # 2. YOLO AI를 이용해 해당 영역 안의 선수들을 탐지하고 관절 좌표를 추출
    result, crop_x, crop_y = detect_players_with_roi(img, roi_data)
    original_kpts = extract_person_keypoints(result, offset_x=crop_x, offset_y=crop_y)

    # 3. 화면에 버튼을 띄우기 위해 선수의 머리 위 좌표를 계산
    player_coords = []
    for i, kpts in enumerate(original_kpts):
        # 관절 데이터 중 화면에 보이는 유효한 좌표만 모음
        valid_y = [pt[1] for pt in kpts if pt is not None]
        valid_x = [pt[0] for pt in kpts if pt is not None]
        
        if valid_y and valid_x:
            # y값이 가장 작은 곳(가장 위쪽)을 머리 꼭대기로 삼음
            top_y = min(valid_y)
            # x값들의 평균을 구해 몸의 중앙 위치를 잡음
            center_x = sum(valid_x) / len(valid_x) 
            
            # 프론트엔드로 보낼 명부에 추가
            player_coords.append({
                "id": i, 
                "x": int(center_x), 
                "y": int(top_y) - 20 # 머리 꼭대기보다 살짝 더 위(-20px)에 버튼을 띄우기 위함
            })

    # 4. 완성된 좌표 명부를 JSON 형태로 프론트엔드에 돌려줌
    return {"players": player_coords}
