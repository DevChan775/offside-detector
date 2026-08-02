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
    original_kpts = extract_person_keypoints(result, offset_x = crop_x, offset_y = crop_y)

    # 프론트에서 받은 4개의 좌표 입력
    matrix, _ = get_perspective_matrix(img, points_data)

    top_down_kpts = transform_all_keypoints(original_kpts, matrix)
    line_x, offside_players, all_players_data = evaluate_offside(img, original_kpts, top_down_kpts)
    
    # 4. JSON 결과 반환
    return {"offside_line": line_x, "players": offside_players, "all_players_data": all_players_data}
