'use client';

import { useState, useRef, MouseEvent } from 'react';

interface PointDrawerProps {
  imageUrl: string;
  onPointsSelect: (points: number[][]) => void;
}

export default function PointDrawer({ imageUrl, onPointsSelect }: PointDrawerProps) {
  // 상태(메모장) 관리: 지금까지 클릭한 좌표들을 배열로 모아둠
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  
  // 사진의 실제 위치를 파악하기 위함
  const imageRef = useRef<HTMLImageElement>(null);

  // 마우스로 사진 위를 클릭했을 때 실행되는 함수
  const handleImageClick = (e: MouseEvent<HTMLDivElement>) => {
    // 이미 4개를 다 찍었다면 더 이상 찍히지 않도록 막음
    if (points.length >= 4 || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    
    // 방금 클릭한 좌표를 기존 메모장(points)에 추가
    const newPoints = [...points, { x, y }];
    setPoints(newPoints);


    if (newPoints.length === 4) {
      // 부모 컴포넌트(page.tsx)가 읽기 편하게 배열 형태 [[x1,y1], [x2,y2], ...]로 변환하여 보냄 
      const formattedPoints = newPoints.map(p => [p.x, p.y]);
      onPointsSelect(formattedPoints);
    }
  };

  // '다시 찍기' 버튼을 눌렀을 때 메모장을 비우는 함수
  const handleReset = () => {
    setPoints([]);
  };

  return (
    <div style={{ display: 'inline-block', position: 'relative', marginTop: '20px' }}>
      <div style={{ marginBottom: '10px' }}>
        <p style={{ fontWeight: 'bold', display: 'inline-block' }}>
          📍 경기장의 기준이 될 4개의 모서리를 클릭해주세요. ({points.length} / 4)
        </p>
        <button onClick={handleReset} style={{ marginLeft: '15px' }}>다시 찍기</button>
      </div>
      
      {/* 사진과 그리기 영역을 감싸는 투명 유리판 */}
      <div
        onClick={handleImageClick}
        style={{ position: 'relative', display: 'inline-block', cursor: 'crosshair', userSelect: 'none' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={imageRef} src={imageUrl} alt="업로드된 축구 사진" draggable={false} style={{ maxWidth: '100%', display: 'block' }} />
        
        {/* 메모장에 기록된 좌표들을 화면 위에 파란색 원으로 표시 */}
        {points.map((pt, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: pt.x - 5, // 점의 중심을 마우스 끝에 맞추기 위해 5px 이동
              top: pt.y - 5,
              width: '10px',
              height: '10px',
              backgroundColor: 'blue',
              borderRadius: '50%', // 동그란 모양
              border: '2px solid white', // 눈에 잘 띄게 흰색 테두리
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
}
