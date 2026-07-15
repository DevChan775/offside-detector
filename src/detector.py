import cv2
from ultralytics import YOLO

# 관절/신체부위를 찾는 Pose 모델 (-pose.pt)사용
model = YOLO('yolov8m-pose.pt')

def detect_players_with_roi(img, roi_box = None):
    """
    메모리 상의 이미지와 프론트엔드에서 전달받은 ROI 영역을 분석
    roi_box: (x, y, w, h) 형태의 튜플 또는 리스트
    """
    if img is None:
        return None, 0, 0
    
    # 웹에서 ROI 좌표가 같이 날아왔다면 잘라내기 적용
    if roi_box and len(roi_box) == 4 and roi_box[2] > 0 and roi_box[3] > 0:
        x, y, w, h = roi_box
        cropped_img = img[y:y+h, x:x+w]

    else:
        cropped_img = img
        x, y = 0, 0

    # Pose 모델이 사람의 관절을 추출
    results = model(cropped_img, conf = 0.4)

    # 원본 좌표 복구를 위해 x, y 반환
    return results[-1], x, y


def extract_person_keypoints(result, offset_x = 0, offset_y = 0):
    """
    YOLO Pose 결과에서 각 선수의 모든 관절 좌표(17개)를 리스트 군집으로 묶어서 반환
    반환 형태: [ [1번 선수의 관절 리스트], [2번 선수의 관절 리스트], ... ]
    """

    all_players_keypoints = []

    # 관절 데이터가 존재하는지 확인
    if result.keypoints is not None and result.keypoints.xy is not None:

        for person_kpts in result.keypoints.xy:

            single_player_kpts = []
            
            # 한 사람의 17개 관절을 순회
            for kpt in person_kpts:
                x, y = int(kpt[0]), int(kpt[1])

                # YOLO는 관절이 화면에 안 보이거나 탐지 못하면 (0,0)을 반환함
                # 오프사이드 계산 시 방해되지 ㄷ않도록 (0,0)은 None 으로 처리 
                if x == 0 and y == 0:
                    single_player_kpts.append(None)
                    
                else:
                    # 마우스로 잘라낸 만큼 다시 더해서 원본 전체 사진 기준 좌표로 복구
                    single_player_kpts.append((x + offset_x, y + offset_y))

            # 완성된 한 명의 관절 리스트를 전체 리스트에 추가
            all_players_keypoints.append(single_player_kpts)

    return all_players_keypoints
