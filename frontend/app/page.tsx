'use client'; 

import { useState } from "react";

export default function Home() {
  const [image, setImage] = useState<File | null>(null);

  // 1. 이용자가 사진을 선택했을 경우
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  // 2. '분석 시작' 버튼을 눌렀을 때 백엔드로 보내는 부분
  const handleSubmit = async () => {
    if (!image) return alert("사진을 먼저 올려주세요!");

    // 통신 패킷을 준비하고 사진과 임시 좌표(roi)를 담음
    const formData = new FormData();
    formData.append("file", image);
    formData.append("roi", "[0, 0, 100, 100]"); // 테스트용 임시 좌표

    try {
      // 3. 백엔드로 패킷 전송
      const response = await fetch("http://127.0.0.1:8000/analyze-offside", {
        method: "POST",
        body: formData,
      });
      
      // 4. 백엔드에서 계산이 끝나고 돌려준 결과(JSON)를 받아 화면에 표시
      const result = await response.json();
      console.log("백엔드에서 온 결과:", result);
      alert("결과가 도착했습니다! (개발자 도구 확인)");
    } catch (error) {
      console.error("통신 에러 발생:", error);
    }
  };

  // 실제 화면에 보여질 HTML 구조
  return (
    <div style = {{padding: '50px' }}>
      <h1>오프사이드 판별 웹 화면⚽</h1>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      <button onClick={handleSubmit} style={{ marginLeft: '10px' }}>분석 시작</button>
      </div>
  );
}
