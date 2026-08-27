'use client'; 

import { useState } from "react";
import RoiDrawer from "@/components/RoiDrawer";
import ResultOverlay from "@/components/ResultOverlay";
import PointDrawer from "@/components/PointDrawer"; 

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [roi, setRoi] = useState<[number, number, number, number] | null>(null);
  const [points, setPoints] = useState<number[][] | null>(null);
  const [resultData, setResultData] = useState<any>(null);

  const [playerCoords, setPlayerCoords] = useState<{id: number, x: number, y: number} [] | null>(null);
  const [attackTeamId, setAttackTeamId] = useState<number | null>(null);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [attackDirection, setAttackDirection] = useState<'left' | 'right' | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImageUrl(URL.createObjectURL(file));

      setRoi(null);
      setPoints(null);
      setPlayerCoords(null);
      setAttackTeamId(null);
      setStep(1);
    }
  };

  const handleRoiSelect = async (selectedRoi: [number, number, number, number]) => {
    setRoi(selectedRoi);
    setStep(2); 

    if (!image) return;

    const formData = new FormData();
    formData.append("file", image);
    formData.append("roi", JSON.stringify(selectedRoi));

    try {
      const response = await fetch("http://127.0.0.1:8000/get-coordinates", {
        method: "POST",
        body: formData,
      });
 
      const result = await response.json();
      setPlayerCoords(result.players);
      setStep(3);

    } catch (error) {
      console.error("좌표 통신 에러", error);
      alert("선수를 찾는데 실패했습니다. 영역을 다시 지정해주세요,"); 
      setStep(1);
    }

  };


  const handlePlayerSelect = (playerId: number) => {
    setAttackTeamId(playerId); 
    setStep(4); 
  };
  

  const handleSubmit = async () => {
    if (!image) return alert("사진을 먼저 올려주세요!");
    if (!roi) return alert("사진 위를 드래그하여 분석 영역을 지정해주세요!");
    if (attackTeamId === null) return alert("공격수를 선택해주세요!");
    if (!points || points.length !== 4) return alert("경기장의 4개의 모서리를 모두 클릭해주세요!");
    if (!attackDirection) return alert("공격 방향을 먼저 설정해주세요!");

    const formData = new FormData();
    formData.append("file",image);


    formData.append("roi", JSON.stringify(roi));
    formData.append("points", JSON.stringify(points));
    formData.append("attack_team", attackTeamId.toString());
    formData.append("attack_direction", attackDirection);

    try {
      const response = await fetch("http://127.0.0.1:8000/analyze-offside", {
        method: "POST",
        body: formData,
      });
      
      const result = await response.json();
      setResultData(result)
    } catch (error) {
      console.error("통신 에러 발생:", error);
    }
  };


return (
    <div style={{ padding: '50px' }}>
      <h1>오프사이드 판별 웹 화면⚽</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label 
          htmlFor="file-upload" 
          style={{
            padding: '5px 20px',
            backgroundColor: '#210808',
            border: '1px solid #ccc',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          파일 선택 버튼
        </label>
  
        <input 
          id="file-upload" 
          type="file" 
          accept="image/*" 
          onChange={handleImageChange} 
          style={{ display: 'none' }} 
        />

          <button onClick={handleSubmit} style={{ marginLeft: '20px' }}>분석 시작</button>
      </div>

      {imageUrl && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ padding: '10px', backgroundColor: 'black', borderRadius: '5px', display: 'inline-block' }}>
            <p style={{ fontWeight: 'bold', margin: '0 0 10px 0', color: 'white' }}>⚽ 공격 방향을 설정해주세요!</p>
            <button 
              onClick={() => setAttackDirection('left')}
              style={{ 
                padding: '10px 20px', 
                marginRight: '10px', 
                backgroundColor: attackDirection === 'left' ? 'blue' : 'gray', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              ⬅️ 왼쪽
            </button>
            <button 
              onClick={() => setAttackDirection('right')}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: attackDirection === 'right' ? 'red' : 'gray', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              오른쪽 ➡️
            </button>
          </div>
          
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

                <img 
                  src={imageUrl} 
                  alt="확대된 선수들"
                  style={{ position: 'absolute', top: -roi[1], left: -roi[0], maxWidth: 'none' }} 
                />
                
              
                {playerCoords.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handlePlayerSelect(player.id)}
                    style={{
                      position: 'absolute',
                      // 잘라낸 영역 기준 위치 재계산 (-25와 -30은 버튼 중앙 정렬용)
                      left: player.x - roi[0] - 25, 
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
          
          {step === 4 && (
            <PointDrawer imageUrl={imageUrl} onPointsSelect={(selectedPoints) => setPoints(selectedPoints)} />
          )}
        </div>
      )}

      {resultData && <ResultOverlay data={resultData} />}
    </div>
  );
}
