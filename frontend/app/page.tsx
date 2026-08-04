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

  // 선수 좌표와 선택된 공격팀 ID를 기억할 메모장 추가 
  const [playerCoords, setPlayerCoords] = useState<{id: number, x: number, y: number} [] | null>(null);
  const [attackTeamId, setAttackTeamId] = useState<number | null>(null);


  // 화면 단계를 기억할 메모장 추가 (1: 영역 지정, 2: 저장 중, 3: 점 찍기)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

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
      setPlayerCoords(null);
      setAttackTeamId(null);
      setStep(1);
    }
  };

  // 영역 지정을 완료('확인' 버튼 클릭)했을 때 실행되는 함수
  const handleRoiSelect = async (selectedRoi: [number, number, number, number]) => {
    setRoi(selectedRoi);
    setStep(2); // 2단계: '선수 찾는 중...' 화면으로 전환

    if (!image) return;

    const formData = new FormData();
    formData.append("file", image);
    formData.append("roi", JSON.stringify(selectedRoi));

    try {
      // 백엔드의 새로운 주소로 좌표 요청
      const response = await fetch("http://127.0.0.1:8000/get-coordinates", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      setPlayerCoords(result.players);

      // 좌표를 받으면 3단계(선수 선택 화면)으로 이동
      setStep(3);

    } catch (error) {
      console.error("좌표 통신 에러", error);
      alert("선수를 찾는데 실패했습니다. 영역을 다시 지정해주세요,"); 
      setStep(1);
    }

  };

  // A(공격) 버튼을 클릭했을 때 실행되는 함수
  const handlePlayerSelect = (playerId: number) => {
    setAttackTeamId(playerId); // 누가 공격팀인지 기록
    setStep(4); // 마지막 4단계(점 찍기) 대기 
  };


  // 2. '분석 시작' 버튼을 눌렀을 때 백엔드로 보내는 부분
  const handleSubmit = async () => {
    if (!image) return alert("사진을 먼저 올려주세요!");
    if (!roi) return alert("사진 위를 드래그하여 분석 영역을 지정해주세요!");
    if (attackTeamId === null) return alert("공격수를 선택해주세요!");
;   if (!points || points.length !== 4) return alert("경기장의 4개의 모서리를 모두 클릭해주세요!");

    // 통신 패킷을 준비하고 사진과 좌표를 담음
    const formData = new FormData();
    formData.append("file",image);

    // 배열 형태인 좌표를 백엔드가 읽기 편하게 문자열로 변환하여 전송
    formData.append("roi", JSON.stringify(roi));

    // 4개의 점 좌표 배열을 담음
    formData.append("points", JSON.stringify(points));

    // 공격팀 정보 저장
    formData.append("attack_team", attackTeamId.toString());

    try {
      // 3. 백엔드로 패킷 전송
      const response = await fetch("http://127.0.0.1:8000/analyze-offside", {
        method: "POST",
        body: formData,
      });
      
      // 4. 백엔드에서 계산이 끝나고 돌려준 결과(JSON)를 받아 화면에 표시
      const result = await response.json();
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
        <button onClick={handleSubmit} style={{ marginLeft: '10px' }}>분석 시작</button>
      </div>

      {imageUrl && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* 1단계 또는 2단계 */}
          {(step === 1 || step === 2) && (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <RoiDrawer imageUrl={imageUrl} onRoiSelect={handleRoiSelect} />
              
              {step === 2 && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', 
                  justifyContent: 'center', alignItems: 'center', color: 'white', 
                  fontSize: '24px', fontWeight: 'bold'
                }}>
                  선수 좌표 찾는 중...
                </div>
              )}
            </div>
          )}

          {/* 3단계: 선수 선택 화면 (드래그한 부분만 확대해서 보여줌) */}
          {step === 3 && roi && playerCoords && (
            <div style={{ marginTop: '20px' }}>
              <h2 style={{ color: 'red' }}>누가 공격수인가요? 머리 위 버튼을 클릭하세요!</h2>
              <div style={{ 
                position: 'relative', 
                width: roi[2], 
                height: roi[3], 
                overflow: 'hidden',
                border: '3px solid red',
                display: 'inline-block'
              }}>
                {/* 원본 사진을 투명 자로 잘라내어 배치 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={imageUrl} 
                  alt="확대된 선수들"
                  style={{ position: 'absolute', top: -roi[1], left: -roi[0], maxWidth: 'none' }} 
                />
                
                {/* 백엔드에서 받은 머리 좌표 위치에 버튼 생성 */}
                {playerCoords.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handlePlayerSelect(player.id)}
                    style={{
                      position: 'absolute',
                      left: player.x - roi[0] - 25, // 잘라낸 영역 기준 위치 재계산 (-25는 버튼 중앙 정렬용)
                      top: player.y - roi[1] - 30,
                      padding: '10px',
                      backgroundColor: 'rgba(255, 0, 0, 0.8)',
                      color: 'white',
                      fontWeight: 'bold',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      zIndex: 10
                    }}
                  >
                    A (공격)
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* 4단계: 점 찍기 화면 */}
          {step === 4 && (
            <PointDrawer imageUrl={imageUrl} onPointsSelect={(selectedPoints) => setPoints(selectedPoints)} />
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
