import os
import glob
import cv2

# 데이터셋 기본 경로 설정 
base_path = os.path.join('dataset', 'players', 'images')

# train, val 데이터 경로 세팅 함수
def setup_dataset(base_dir):
    # 폴더 안의 모든 jpg 파일 경로를 찾기 위한 패턴 설정
    train_pattern = os.path.join(base_dir, 'train', '*.jpg')
    val_pattern = os.path.join(base_dir, 'val', '*.jpg')

    # glob을 이용하여 실제 파일들의 리스트를 생성
    train_images = glob.glob(train_pattern)
    val_images = glob.glob(val_pattern)

    # 에러 방지 1: 데이터가 한 장도 없을 때 경고 메시지 출력
    if len(train_images) == 0 and len(val_images) == 0:
        print(f"WARNING: No images found in '{base_dir}'. Please check the directory structure.")
        return train_images, val_images
    
    # 에러 방지 2: 첫번째 이미지가 있다면, 첫 번째 이미지가 깨지지 않고 잘 읽히는지 검증
    if len(train_images) > 0:
        test_img = cv2.imread(train_images[0])
        if test_img is None:
            print("WARNING: Failed to load the test image. It might be corrupted.")

        else:
            print("SUCCESS: Image validation passed. OpenCV loaded the data normally.")

    return train_images, val_images

# 데이터 세팅 실행
train_data, val_data = setup_dataset(base_path)

if __name__ == "__main__":
    print("=== Starting Soccer Dataset Setup & Validation ===")
    print(f"📦 Train images found: {len(train_data)}")
    print(f"📦 Val images found: {len(val_data)}")
    print("=== Dataset Setup Complete ===")
  
