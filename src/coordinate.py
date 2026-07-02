import cv2
import numpy as np

# 사용자가 클릭한 4개의 좌표를 잠시 보관할 리스트
clicked_points = []

def mouse_click(event, x, y, flags, param):
    """ 마우스 클릭 감지 및 빨간 점 표시 (기존과 동일) """
    if event == cv2.EVENT_LBUTTONDOWN:
        clicked_points.append([x, y])
        print(f"✅ 좌표 선택됨: ({x}, {y}) - 현재 {len(clicked_points)}/4")
        img_copy = param.copy()
        for pt in clicked_points:
            cv2.circle(img_copy, tuple(pt), 5, (0, 0, 255), -1)
        cv2.imshow("Select 4 Points", img_copy)

def get_perspective_matrix(image_path):
    """ 4개의 점을 입력받아 변환 행렬(matrix) 반환 (기존과 동일) """
    global clicked_points
    clicked_points = [] 

    img = cv2.imread(image_path)
    if img is None: return None, None
    
    height, width = img.shape[:2]
    scale = 1.0
    max_dim = 1000
    if max(height, width) > max_dim:
        scale = max_dim / max(height, width) 
        img_resized = cv2.resize(img, (int(width * scale), int(height * scale)))
    else:
        img_resized = img.copy()

    cv2.namedWindow("Select 4 Points")
    cv2.setMouseCallback("Select 4 Points", mouse_click, img_resized)

    print("\n🖱️ [원근감 보정] 직사각형 네 모서리를 클릭하세요! (좌상->우상->우하->좌하)")
    cv2.imshow("Select 4 Points", img_resized)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

    if len(clicked_points) != 4: return None, None   

    pts_original = np.float32(clicked_points) / scale
    top_width, top_height = 800, 600
    pts_flat = np.float32([[0, 0], [top_width, 0], [top_width, top_height], [0, top_height]])

    matrix = cv2.getPerspectiveTransform(pts_original, pts_flat)
    print("✅ 투시 변환 행렬(Matrix) 계산 완료")
    
    return matrix, (top_width, top_height)

def transform_point(pt, matrix):
    """ 점 1개를 탑뷰 좌표로 변환 (기존에 추가했던 함수) """
    pt_array = np.float32([[[pt[0], pt[1]]]])
    transformed = cv2.perspectiveTransform(pt_array, matrix)
    return int(transformed[0][0][0]), int(transformed[0][0][1])

# ==============================================================================
# 🚀 [새로 추가된 부분] 모든 선수의 17개 관절 리스트를 한 번에 변환하는 함수
# ==============================================================================
def transform_all_keypoints(players_kpts, matrix):
    """
    detector.py에서 가져온 전체 관절 리스트를 순회하며 모두 탑뷰 좌표로 바꿈
    """
    transformed_players = []

    for person_kpts in players_kpts:
        transformed_person = []
        for kpt in person_kpts:
            if kpt is None:
                # 화면에 안 보여서 None 처리된 관절은 그대로 None으로 둠
                transformed_person.append(None)
            else:
                # 관절 좌표가 있으면 변환 공식(matrix)에 넣어 위치를 바꿈.
                new_pt = transform_point(kpt, matrix)
                transformed_person.append(new_pt)
                
        transformed_players.append(transformed_person)
        
    return transformed_players

if __name__ == "__main__":
    from data_setup import setup_dataset, base_path
    
    # 테스트를 위해 detector.py에서 만든 함수들을 불러옴
    from detector import detect_players_with_roi, extract_person_keypoints
    
    train_data, _ = setup_dataset(base_path)
    
    if len(train_data) > 0:
        test_image = train_data[1] 
        
        # 1. 원근감 보정 행렬(공식) 생성
        matrix, top_view_size = get_perspective_matrix(test_image)
        
        if matrix is not None:
            # 2. detector로 원본 사진에서 관절 좌표 찾기 (결과 리스트 추출)
            result, crop_x, crop_y = detect_players_with_roi(test_image)
            original_kpts = extract_person_keypoints(result, offset_x=crop_x, offset_y=crop_y)
            
            # 3. 방금 찾은 좌표 리스트를 새로 만든 함수에 넣어 탑뷰 좌표로 모두 이동
            top_down_kpts = transform_all_keypoints(original_kpts, matrix)
            
            # 4. 결과 확인
            if len(top_down_kpts) > 0:
                print(f"\n 원본 관절 좌표 (1번 선수): \n{original_kpts[0]}")
                print(f"\n 탑뷰로 이동된 좌표 (1번 선수): \n{top_down_kpts[0]}")
                
    else:
        print("테스트할 이미지가 없습니다.")
