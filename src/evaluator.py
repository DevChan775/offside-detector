import numpy as np
from sklearn.cluster import KMeans

# YOLO Pose 기준 : 7(왼팔꿈치), 8(오른팔꿈치), 9(왼손목), 10(오른손목)
INVALID_JOINTS = [7, 8, 9, 10]

# 몸통 관절: 5(왼어깨), 6(오른어깨), 11(왼골반), 12(오른골반) -> 유니폼 색 추출용
TORSO_JOINTS = [5, 6, 11, 12]

def extract_troso_color(image, person_kpts):
    """
    선수의 원본 좌표를 이용해 유니폼의 색상을 추출
    """

    torso_pts = [person_kpts[i] for i in TORSO_JOINTS if person_kpts[i] is not None]

    if not torso_pts:
        return [0,0,0] # 몸통이 안 보이면 검은색으로 처리
    
    # 몸통 좌표 (왼쪽 어깨, 오른쪽 어깨, 왼쪽 골반, 오른쪽 골반)의 평균으로 위치를 구함
    avg_x = int(np.mean([pt[0] for pt in torso_pts]))
    avg_y = int(np.mean([pt[1] for pt in torso_pts]))

    # 몸통 중심 픽셀의 색상(BGR) 가져오기 (몸통 중심 색상 = 유니폼 색상)
    h, w = image.shape[:2]
    if 0 <= avg_x and 0 <= avg_y < h:
        return image[avg_y, avg_x]
    
    return [0,0,0]

# ==========================================
# 👕 2. 팀 분류 (피아 식별)
# ==========================================

def split_teams(image, all_original_kpts):
    """
    KMeans를 이용해 추출한 유니폼 색상을 바탕으로 선수를 2팀으로 나눔
    """
    colors = []
    for kpts in all_original_kpts:
        colors.append(extract_troso_color(image, kpts))

    # 색상 데이터를 바탕으로 0과 1, 두 개의 그룹으로 클러스터링
    kmeans = KMeans(n_clusters = 2, random_state = 42, n_init = 10)
    kmeans.fit(colors)
    return kmeans.labels_

# ==========================================
# 🏃‍♂️ 3. 가장 전진한 유효 좌표 찾기
# ==========================================

def get_advanced_x(top_down_kpts, direction):
    """
    팔/손을 제외한 유효 관절 중 가장 골대와 가까운 x좌표를 찾는다.
    """
    valid_x = []
    for i, kpt in enumerate(top_down_kpts):
        if kpt is None: continue
        if i in INVALID_JOINTS: continue # 손/팔은 오프사이드 제외

        valid_x.append(kpt[0]) # x좌표만 수집

    if not valid_x: return None

    # 오른쪽 공격이면 가장 큰 x, 왼쪽 공격이면 가장 작은 x 반환
    return max(valid_x) if direction == 'right' else min(valid_x)


# ==========================================
# 4. 오프사이드 최종 판별 메인 로직
# ==========================================

def evaluate_offside(image, original_kpts, top_down_kpts, attack_direction = 'right', attack_team_id = 0):
    """
    모든 재료를 받아 최종적으로 오프사이드 라인을 긋고 위반 선수를 찾아냄
    """
    # 1. 선수들 팀 나누기 (0번 팀 vs 1번 팀)
    team_labels = split_teams(image, original_kpts)

    attackers = []
    defenders = []

    # 2. 각 선수의 가장 영향력 높은 점(X 좌표)를 구해서 팀별로 분류
    for i in range(len(top_down_kpts)):
        adv_x = get_advanced_x(top_down_kpts[i], attack_direction)
        if adv_x is None: continue
        
        player_data = {'id': i, 'x': adv_x}
        if team_labels[i] == attack_team_id:
            attackers.append(player_data)

        else:
            defenders.append(player_data)

    # 3. 오프사이드 기준선 긋기 (수비팀에서 두 번째로 뒤에 있는 선수 찾기)
    if len(defenders) < 1:
        return None, "⚠️ 화면에 수비수가 1명도 없어서 기준선을 그을 수 없습니다."
    
    if attack_direction == 'right':
        # 오른쪽 공격 시, X 좌표가 가장 큰 순서대로 내림차순 정렬
        defenders.sort(key = lambda d: d['x'], reverse = True)
    
    else:
        # 왼쪽 공격 시, X 좌표가 가장 작은 순서대로 오름차순 정렬
        defenders.sort(key = lambda d: d['x'], reverse = False)

    offside_line_x = defenders[0]['x']

    # 4. 공격수들과 오프사이드 라인 비교 (회원님의 아이디어 부분!)
    offside_players = []
    for atk in attackers:
        if attack_direction == 'right' and atk['x'] > offside_line_x:
            offside_players.append(atk['id'])
        elif attack_direction == 'left' and atk['x'] < offside_line_x:
            offside_players.append(atk['id'])
            
    return offside_line_x, offside_players


# ==========================================
# 🧪 단독 테스트 실행 코드
# ==========================================
if __name__ == "__main__":
    import cv2
    from data_setup import setup_dataset, base_path
    from cordinate import get_perspective_matrix, transform_all_keypoints
    from detector import detect_players_with_roi, extract_person_keypoints

    print("🚀 evaluator.py 단독 테스트를 시작합니다...")

    train_data, _ = setup_dataset(base_path)
    if len(train_data) > 0:
        test_image = train_data[1]
        img = cv2.imread(test_image)

        matrix, _ = get_perspective_matrix(test_image)

        if matrix is not None:
            result, crop_x, crop_y = detect_players_with_roi(test_image)
            
            if result is not None:
                original_kpts = extract_person_keypoints(result, offset_x=crop_x, offset_y=crop_y)
                top_down_kpts = transform_all_keypoints(original_kpts, matrix)

                print("\n▶️ [평가 중] 오프사이드 판독 로직 가동...")
                line_x, offside_players = evaluate_offside(
                    image=img, 
                    original_kpts=original_kpts, 
                    top_down_kpts=top_down_kpts, 
                    attack_direction='right', 
                    attack_team_id=0          
                )

                print("\n" + "="*40)
                print(" 🏁 [테스트 최종 결과] ")
                print("="*40)
                if line_x is None:
                    print(f"⚠️ 에러 발생: {offside_players}")
                else:
                    print(f"📍 최후방 수비수 기준선 (탑뷰 X좌표): {line_x}")
                    if len(offside_players) > 0:
                        print(f"🚨 오프사이드 위반 적발! (해당 공격수 ID: {offside_players})")
                    else:
                        print("✅ 온사이드 (위반한 공격수 없음)")
                print("="*40)
    else:
        print("⚠️ 테스트할 이미지가 없습니다.")
