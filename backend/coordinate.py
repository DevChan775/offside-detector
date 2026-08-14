import cv2
import numpy as np

def get_perspective_matrix(img, clicked_points):
    """ 
    웹에서 수집한 4개의 좌표와 메모리 이미지를 받아 변환 행렬 반환
    clicked_points: [[x1, y1], [x2, y2], [x3, y3], [x4, y4]] 형태의 리스트
    """
    if img is None or len(clicked_points) != 4:
        return None, None
    
    # 이미지 크기가 화면을 뚫고 나갈 위험 방지
    height, width = img.shape[:2]
    scale = 1.0
    max_dim = 1000
    if max(height, width) > max_dim:
        scale = max_dim / max(height, width)

    # 위에서 선택한 4개의 좌표를 원근감 보정 후 이동 결과를 담기 위한 세팅
    pts_original = np.float32(clicked_points) / scale
    top_width, top_height = 800, 600
    pts_flat = np.float32([[0,0], [top_width, 0], [top_width, top_height], [0, top_height]])

    # 원근감 보정 행렬 연산
    matrix = cv2.getPerspectiveTransform(pts_original, pts_flat)

    return matrix, (top_width, top_height)


def transform_point(pt, matrix):
    """ 점 1개를 탑뷰 좌표로 변환"""
    pt_array = np.float32([[[pt[0], pt[1]]]])
    transformed = cv2.perspectiveTransform(pt_array, matrix)
    return int(transformed[0][0][0]), int(transformed[0][0][1])

def transform_all_keypoints(players_kpts, matrix):
    """
    전체 관절 리스트를 순회하며 모두 탑뷰 좌표로 바꿈
    """
    transformed_players = []

    for person_kpts in players_kpts:
        transformed_person = []
        for kpt in person_kpts:
            if kpt is None:
                # 화면에 잘 안 보여서 None 처리된 관절은 그대로 None으로 둠
                transformed_person.append(None)

            else:
                # 관절 좌표가 있으면 변환
                new_pt = transform_point(kpt, matrix)
                transformed_person.append(new_pt)

        transformed_players.append(transformed_person)

    return transformed_players
