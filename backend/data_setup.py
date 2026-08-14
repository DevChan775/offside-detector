import cv2
import numpy as np

def process_web_image(file_bytes):
    """
    웹에서 전달받은 바이너리 데이터를 하드디스크 저장 없이 
    즉시 OpenCV 이미지 배열로 변환
    """
    # 0과 1로 이루어진 웹 데이터를 파이썬이 읽을 수 있는 배열로 변환
    nparr = np.frombuffer(file_bytes, np.uint8)

    # 배열을 OpenCV 이미지로 해독
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return None, "⚠️ 에러: 이미지를 해독할 수 없습니다."
    
    return img, "SUCCESS"



