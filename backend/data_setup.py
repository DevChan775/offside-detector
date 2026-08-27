import cv2
import numpy as np

def process_web_image(file_bytes):
    """
    웹에서 전달받은 이미지 바이너리 데이터를 디스크 저장(I/O) 과정 없이 
    메모리 상의 OpenCV 배열(NumPy)로 디코딩을 진행
    """
    nparr = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return None, "⚠️ 에러: 이미지를 해독할 수 없습니다."
    
    return img






