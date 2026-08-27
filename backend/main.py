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

# CORS 설정 
app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_methods = ["*"],
    allow_headers = ["*"],
)

@app.post("/analyze-offside")
async def analyze_offside(file: UploadFile = File(...), roi: str = Form(...), points: str = Form(...), attack_team: int = Form(...), attack_direction: str = Form(...)):
    """
    프론트엔드 데이터를 바탕으로 오프사이드 위반 여부를 판별하고 결과를 반환하는 API
    """    
    contents = await file.read()
    img = process_web_image(contents)

    roi_data = json.loads(roi) 
    points_data = json.loads(points) 

    # 모델 추론 및 관절 좌표 추출
    result, crop_x, crop_y = detect_players_with_roi(img, roi_data)
    original_kpts = extract_person_keypoints(result, offset_x = crop_x, offset_y = crop_y)

    # 원근감 보정 
    matrix, _ = get_perspective_matrix(img, points_data)
    top_down_kpts = transform_all_keypoints(original_kpts, matrix)

    # 오프사이드 최종 판별
    line_x, offside_players, all_players_data = evaluate_offside(
        img, original_kpts, top_down_kpts , selected_player_id = attack_team, attack_direction = attack_direction
        )
    
    return {
        "offside_line": line_x, 
        "players": offside_players, 
        "all_players_data": all_players_data}   



@app.post("/get-coordinates")
async def get_coordinates(file: UploadFile = File(...), roi: str = Form(...)):
    """
    선수 선택 버튼 렌더링을 위해 이미지 내 각 선수의 머리 위 좌표를 개산하여 반환하는 API
    """
    contents = await file.read()
    img = process_web_image(contents)
    roi_data = json.loads(roi)

    result, crop_x, crop_y = detect_players_with_roi(img, roi_data)
    original_kpts = extract_person_keypoints(result, offset_x = crop_x, offset_y = crop_y)

    player_coords = []
    for i, kpts in enumerate(original_kpts):

        valid_y = [pt[1] for pt in kpts if pt is not None]
        valid_x = [pt[0] for pt in kpts if pt is not None]
        
        if valid_y and valid_x:
            top_y = min(valid_y)
            center_x = sum(valid_x) / len(valid_x) 
            
            player_coords.append({
                "id": i, 
                "x": int(center_x), 
                "y": int(top_y) - 20 # 머리 꼭대기보다 살짝 더 위(-20px)에 버튼을 띄우기 위함
            })


    return {"players": player_coords}
