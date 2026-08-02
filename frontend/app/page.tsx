'use client'; 

import { useState } from "react";
import RoiDrawer from "@/components/RoiDrawer";
import ResultOverlay from "@/components/ResultOverlay";
import PointDrawer from "@/components/PointDrawer"; 

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [roi, setRoi] = useState<[number, number, number, number] | null>(null);

  // 4개의 점 좌표를 저정할 메모장 생성
  const [points, setPoints] = useState<number[][] | null>(null);

  // 백엔드 결과를 저장할 메모장 생성
  const [resultData, setResultData] = useState<any>(null);

  // 화면 단계를 기억할 메모장 추가 (1: 영역 지정, 2: 저장 중, 3: 점 찍기)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // 1. 이용자가 사진을 선택했을 경우
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);

      // 사진을 브라우저가 읽을 수 있는 주소로 현상하여 메모장에 저장
      setImageUrl(URL.createObjectURL(file));

      // 새 사진이 올라오면 모든 과정을 1단계로 초기화
      setRoi(null);
      setPoints(null);
      setStep(1);
    }
  };

  // 영역 지정을 완료('확인' 버튼 클릭)했을 때 실행되는 함수
  const handleRoiSelect = (selectedRoi: [number, number, number, number]) => {
    setRoi(selectedRoi);
    setStep(2); // 2단계: '저장 중' 화면으로 변경

    // 3단계로 부드럽게 넘어가도록 예약
    setTimeout(() => {
      setStep(3);
    }, 1000);

  };


  // 2. '분석 시작' 버튼을 눌렀을 때 백엔드로 보내는 부분
  const handleSubmit = async () => {
    if (!image) return alert("사진을 먼저 올려주세요!");
    if (!roi) return alert("사진 위를 드래그하여 분석 영역을 지정해주세요!");
    if (!points || points.length !== 4) return alert("경기장의 4개의 모서리를 모두 클릭해주세요!");

    // 통신 패킷을 준비하고 사진과 좌표를 담음
    const formData = new FormData();
    formData.append("file",image);

    // 배열 형태인 좌표를 백엔드가 읽기 편하게 문자열로 변환하여 전송
    formData.append("roi", JSON.stringify(roi));

    // 4개의 점 좌표 배열을 담음
    formData.append("points", JSON.stringify(points));

    try {
      // 3. 백엔드로 패킷 전송
      const response = await fetch("http://127.0.0.1:8000/analyze-offside", {
        method: "POST",
        body: formData,
      });
      
      // 4. 백엔드에서 계산이 끝나고 돌려준 결과(JSON)를 받아 화면에 표시
      const result = await response.json();
      console.log("백엔드에서 온 결과:", result);

      // 백엔드 결과를 resultData에 저장
      setResultData(result)

    } catch (error) {
      console.error("통신 에러 발생:", error);
    }
  };

// 실제 화면에 보여질 HTML 구조
return (
    <div style={{ padding: '50px' }}>
      <h1>오프사이드 판별 웹 화면⚽</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        <button onClick={handleSubmit} style={{ marginLeft : '10px' }}>분석 시작</button>
      </div>

      {imageUrl && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* 1단계 또는 2단계일 때 네모 그리기 화면을 보여줌 */}
          {(step === 1 || step === 2) && (
            <div 
              style={{ 
                // step이 2가 되면 투명도를 0으로 만들어 자연스럽게 사라짐
                opacity: step === 1 ? 1 : 0, 
                transition: 'opacity 1s ease-out', // 1초 동안 부드럽게 변하는 애니메이션
                position: 'relative'
              }}
            >
              <RoiDrawer
                imageUrl={imageUrl}
                onRoiSelect={handleRoiSelect}
              />
              
              {/* step이 2일 때 사진 위에 나타날 검은색 반투명 막과 '저장 중' 텍스트 */}
              {step === 2 && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', 
                  justifyContent: 'center', alignItems: 'center', color: 'white', 
                  fontSize: '24px', fontWeight: 'bold'
                }}>
                  저장 중...
                </div>
              )}
            </div>
          )}
          
          {/* 3단계가 되었을 때만 점 찍기 화면을 보여줌 */}
          {step === 3 && (
            <PointDrawer
              imageUrl={imageUrl}
              onPointsSelect={(selectedPoints) => setPoints(selectedPoints)}
            />
          )}
        </div>
      )}

      {resultData && <ResultOverlay data={resultData} />}
    </div>
  );
}

      {resultData && <ResultOverlay data = {resultData} />}
    </div>
  );
}
