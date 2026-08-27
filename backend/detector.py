import cv2
from ultralytics import YOLO

model = YOLO('yolov8m-pose.pt')

def detect_players_with_roi(img, roi_box = None):
    """
    주어진 이미지에서 지정된 ROI를 잘라내어 선수의 관절을 탐지
    추후 좌표 보정을 위해 시작점(x, y)을 결과와 함께 반환
    """
    if img is None:
        return None, 0, 0
    
    if roi_box and len(roi_box) == 4 and roi_box[2] > 0 and roi_box[3] > 0:
        x, y, w, h = roi_box
        cropped_img = img[y:y+h, x:x+w]

    else:
        cropped_img = img
        x, y = 0, 0

    results = model(cropped_img, conf = 0.4)

    return results[-1], x, y


def extract_person_keypoints(result, offset_x = 0, offset_y = 0):
    """
    탐지된 YOLO 관절 데이터를 원본 전체 이미지 기준의 좌표로 변환하여 추출
    """
    all_players_keypoints = []


    if result.keypoints is not None and result.keypoints.xy is not None:
        for person_kpts in result.keypoints.xy:
            single_player_kpts = []
            
            for kpt in person_kpts:
                x, y = int(kpt[0]), int(kpt[1])

                # 미탐지 관절(0, 0)로 인한 오프사이드 계산 오류 방지용 예외 처리
                if x == 0 and y == 0:
                    single_player_kpts.append(None)
                    
                else:
                    # 크롭된 좌표를 원본 이미지 기준으로 보정
                    single_player_kpts.append((x + offset_x, y + offset_y))

            all_players_keypoints.append(single_player_kpts)

    return all_players_keypoints

