'use client'; 

import { useState } from "react";
import RoiDrawer from "@/components/RoiDrawer";
import ResultOverlay from "@/components/ResultOverlay";

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [roi, setRoi] = useState<[number, number, number, number] | null>(null);

  // 백엔드 결과를 저장할 메모장 생성
  const [resultData, setResultData] = useState<any>(null);

  // 1. 이용자가 사진을 선택했을 경우
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);

      // 사진을 브라우저가 읽을 수 있는 주소로 현상하여 메모장에 저장
      setImageUrl(URL.createObjectURL(file));

      // 새 사진이 올라오면 예전 좌표는 지워서 초기화
      setRoi(null);
    }
  };

  // 2. '분석 시작' 버튼을 눌렀을 때 백엔드로 보내는 부분
  const handleSubmit = async () => {
    if (!image) return alert("사진을 먼저 올려주세요!");
    if (!roi) return alert("사진 위를 드래그하여 분석 영역을 지정해주세요!");

    // 통신 패킷을 준비하고 사진과 좌표를 담음
    const formData = new FormData();
    formData.append("file",image);

    // 배열 형태인 좌표를 백엔드가 읽기 편하게 문자열로 변환하여 전송
    formData.append("roi", JSON.stringify(roi));

    try {
      // 3. 백엔드로 패킷 전송
      const response = await fetch("http://localhost:8000/analyze-offside", {
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
    <div style = {{padding: '50px' }}>
      <h1>오프사이드 판별 웹 화면⚽</h1>
      
      <div style = {{marginBottom: '20px' }}>
        <input type = "file" accept = "image/*" onChange = {handleImageChange} />
        <button onClick = {handleSubmit} style = {{ marginLeft : '10px' }}>분석 시작</button>
      </div>

      {/* 현상된 사진 주소가 있을 때만 Roi 실행 */}
      {imageUrl && (
        <RoiDrawer
            imageUrl = {imageUrl}
            onRoiSelect = {(selectedRoi) => setRoi(selectedRoi)}
            />
      )}

      {/* resultData가 도착했다면 3D 스튜디오에 데이터를 넣어서 화면에 보여줌*/}
      {resultData && <ResultOverlay data = {resultData} />}
    </div>
  );
}
