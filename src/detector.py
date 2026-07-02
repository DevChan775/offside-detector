import os
import cv2
from ultralytics import YOLO

# 관절/신체부위를 찾는 Pose 모델(-pose.pt) 사용
model = YOLO('yolov8m-pose.pt')

def detect_players_with_roi(image_path):
    """
    사용자가 드래그한 영역안의 사람과 신체 부위(Keypoints)를 탐지하는 함수
    """
    img = cv2.imread(image_path)
    if img is None:
        print(f"⚠️ Error: Cannot load image at {image_path}")
        return None
    
    print("\n [Mouse Action] Drag to select the field area with players, then press 'Enter' or 'Space'!")

    # 마우스로 영역 지정 팝업창 띄우기
    roi = cv2.selectROI("Drag Soccer Field (ROI)", img, showCrosshair=False, fromCenter=False)
    cv2.destroyWindow("Drag Soccer Field (ROI)")

    x, y, w, h = roi

    # 드래그 유효성 검사 및 잘라내기
    if w > 0 and h > 0:
        cropped_img = img[y:y+h, x:x+w]
        print(f"✅ ROI selected! Analyzing within ({w}x{h}) area.")
    else:
        cropped_img = img
        print("💡 No ROI selected. Analyzing the entire image.")

    # Pose 모델은 자동으로 사람의 관절(Keypoints)을 추출 (conf는 0.15 유지)
    results = model(cropped_img, conf=0.4)

    # x,y 를 반환한 이유는 원본 좌표로 복구하기 위함
    return results[-1], x, y


def extract_person_keypoints(result, offset_x=0, offset_y=0):
    """
    YOLO Pose 결과에서 각 선수의 모든 관절 좌표(17개)를 리스트 군집으로 묶어서 반환합니다.
    반환 형태: [ [1번 선수의 관절 리스트], [2번 선수의 관절 리스트], ... ]
    """
    all_players_keypoints = []

    # 관절 데이터가 존재하는지 확인
    if result.keypoints is not None and result.keypoints.xy is not None:
        
        # 사람 한 명씩 순회 (result.keypoints.xy는 사람수 x 17 x 2 형태의 배열)
        for person_kpts in result.keypoints.xy:
            single_player_kpts = []
            
            # 한 사람의 17개 관절을 순회
            for kpt in person_kpts:
                x, y = int(kpt[0]), int(kpt[1])
                
                # YOLO는 관절이 화면에 안 보이거나 탐지 못하면 (0, 0)을 반환함
                # 오프사이드 계산 시 방해되지 않도록 (0, 0)은 None으로 처리
                if x == 0 and y == 0:
                    single_player_kpts.append(None)
                else:
                    # 마우스로 잘라낸 만큼(offset) 다시 더해서 원본 전체 사진 기준 좌표로 복구
                    single_player_kpts.append((x + offset_x, y + offset_y))
            
            # 완성된 한 명의 관절 리스트를 전체 리스트에 추가
            all_players_keypoints.append(single_player_kpts)
            
    return all_players_keypoints


if __name__ == "__main__":
    from data_setup import setup_dataset, base_path

    train_data, _ = setup_dataset(base_path)

    if len(train_data) > 0:
        test_image = train_data[1]

        # ROI 탐지 함수 실행
        result, crop_x, crop_y = detect_players_with_roi(test_image)

        if result is not None:
            print(f"✅ Detection complete! Found {len(result.boxes)} players in the selected area.")

            # 새로 만든 함수 테스트: 군집화된 좌표 출력
            players_kpts = extract_person_keypoints(result, offset_x=crop_x, offset_y=crop_y)
            
            print(f"\n총 {len(players_kpts)}명의 선수를 분석했습니다.")
            if len(players_kpts) > 0:
                print(f"👉 1번 선수의 관절 리스트 (총 17개 부위):\n{players_kpts[0]}")

            img_with_boxes = result.plot()
            height, width, _ = img_with_boxes.shape
            enlarged_img = cv2.resize(img_with_boxes, (width * 2, height * 2), interpolation=cv2.INTER_LINEAR)
            
            cv2.imshow("Detection Result (Enlarged)", enlarged_img)
            print("\n⌨️ Press any key on the result window to close it.")
            cv2.waitKey(0)
            cv2.destroyAllWindows()
    else:
        print("⚠️ No images found for testing.")
