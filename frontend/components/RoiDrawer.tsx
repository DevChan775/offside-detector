'use client';

import { useState, useRef, MouseEvent } from 'react';

// 부모(page.tsx)와 데이터를 주고받기 위한 약속(인터페이스)
interface RoiDrawerProps {
  imageUrl: string;
  onRoiSelect: (roi: [number, number, number, number]) => void;
}

export default function RoiDrawer({ imageUrl, onRoiSelect }: RoiDrawerProps) {
  // 상태(메모장) 관리: 그리는 중인지, 시작점은 어디인지, 현재 마우스 위치는 어디인지 기록
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  
  // 사진의 실제 위치를 파악하기 위한 투명 자
  const imageRef = useRef<HTMLImageElement>(null);

  // 1. 마우스를 꾹 눌렀을 때 (그리기 시작)
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect(); // 사진의 여백 계산
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setStartPos({ x, y });
    setCurrentPos({ x, y });
    setIsDrawing(true);
  };

  // 2. 마우스를 누른 채로 움직일 때 (실시간 네모 크기 변경)
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentPos({ x, y });
  };

  // 3. 마우스를 뗐을 때 (그리기 완료 및 데이터 전송)
  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // [x, y, 너비, 높이] 계산 로직 (마우스를 거꾸로 드래그할 경우도 대비하여 Math.min 사용)
    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const w = Math.abs(currentPos.x - startPos.x);
    const h = Math.abs(currentPos.y - startPos.y);

    // 부모 컴포넌트(page.tsx)로 계산된 좌표 전송 (소수점은 반올림)
    onRoiSelect([Math.round(x), Math.round(y), Math.round(w), Math.round(h)]);
  };

  // 화면에 덧그려질 빨간색 반투명 네모 상자의 디자인
  const boxStyle = {
    position: 'absolute' as const,
    left: Math.min(startPos.x, currentPos.x),
    top: Math.min(startPos.y, currentPos.y),
    width: Math.abs(currentPos.x - startPos.x),
    height: Math.abs(currentPos.y - startPos.y),
    border: '2px solid red',
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    pointerEvents: 'none' as const, // 네모가 마우스 클릭을 방해하지 않도록 설정
  };

  // 실제 화면 출력 부분
  return (
    <div style={{ display: 'inline-block', position: 'relative', marginTop: '20px' }}>
      <p style={{ fontWeight: 'bold' }}>📸 사진 위를 마우스로 드래그하여 분석 영역(ROI)을 지정해주세요.</p>
      
      {/* 사진과 그리기 영역을 감싸는 투명 유리판 */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} // 마우스가 사진 밖으로 나가도 그리기를 멈춤
        style={{ position: 'relative', display: 'inline-block', cursor: 'crosshair', userSelect: 'none' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={imageRef} src={imageUrl} alt="업로드된 축구 사진" draggable = {false} style={{ maxWidth: '100%', display: 'block' }} />
        
        {/* 드래그 중이거나 영역 지정이 완료되었을 때 네모 상자를 화면에 표시 */}
        {(isDrawing || startPos.x !== currentPos.x) && <div style={boxStyle}></div>}
      </div>
    </div>
  );
}
