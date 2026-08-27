'use client';

import { useState, useRef, MouseEvent } from 'react';

interface PointDrawerProps {
  imageUrl: string;
  onPointsSelect: (points: number[][]) => void;
}

export default function PointDrawer({ imageUrl, onPointsSelect }: PointDrawerProps) {
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleImageClick = (e: MouseEvent<HTMLDivElement>) => {
    if (points.length >= 4 || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    const newPoints = [...points, { x, y }];
    setPoints(newPoints);


    if (newPoints.length === 4) {
      const formattedPoints = newPoints.map(p => [p.x, p.y]);
      onPointsSelect(formattedPoints);
    }
  };

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
 
      <div  
        onClick={handleImageClick}
        style={{ position: 'relative', display: 'inline-block', cursor: 'crosshair', userSelect: 'none' }}
      >
        <img ref={imageRef} src={imageUrl} alt="업로드된 축구 사진" draggable={false} style={{ maxWidth: '100%', display: 'block' }} />
      
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
              borderRadius: '50%', 
              border: '2px solid white', 
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
}
