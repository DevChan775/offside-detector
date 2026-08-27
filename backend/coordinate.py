import cv2
import numpy as np

def get_perspective_matrix(img, clicked_points):
    """
    사용자가 지정한 4개의 기준 좌표를 바탕으로 
    탑뷰(Top-down) 시점으로 변환하기 위해 원근 보정 행렬을 계산
    """
    if img is None or len(clicked_points) != 4:
        return None, None

    pts_original = np.float32(clicked_points)

    # 탑뷰 변환 후 투영될 목표 평면의 4개 모서리 좌표 세팅
    top_width, top_height = 800, 600
    pts_flat = np.float32([[0,0], [top_width, 0], [top_width, top_height], [0, top_height]])

    matrix = cv2.getPerspectiveTransform(pts_original, pts_flat)

    return matrix, (top_width, top_height)


def transform_point(pt, matrix):
    """단일 좌표를 탑뷰 평면 좌표로 변환"""
    pt_array = np.float32([[[pt[0], pt[1]]]])
    transformed = cv2.perspectiveTransform(pt_array, matrix)
    return int(transformed[0][0][0]), int(transformed[0][0][1])

def transform_all_keypoints(players_kpts, matrix):
    """
    추출된 모든 선수의 관절 좌표를 탑뷰 시점으로 일괄 변환
    """
    transformed_players = []

    for person_kpts in players_kpts:
        transformed_person = []
        for kpt in person_kpts:
            if kpt is None:
                transformed_person.append(None)

            else:
                new_pt = transform_point(kpt, matrix)
                transformed_person.append(new_pt)

        transformed_players.append(transformed_person)

    return transformed_players
