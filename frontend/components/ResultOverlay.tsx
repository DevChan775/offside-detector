'use client';

import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// 백엔드에서 받아올 데이터의 형태 (약속)
interface PlayerData {
  id: number;
  x: number;
  y: number; // 탑뷰에서의 y좌표는 3D 공간에서 z좌표(깊이)로 사용
  team: number;
}

interface ResultData {
  offside_line: number;
  players: number[]; // 오프사이드 위반 선수의 ID 목록
  all_players_data: PlayerData[]; // 🚨 백엔드에서 추가로 받아와야 할 데이터
}

interface ResultOverlayProps {
  data: ResultData | null;
}

// 3D 공간에 선수(마네킹)를 배치하는 부품
function Players({ data }: { data: ResultData }) {
  // 회원님의 GLTF 모델이 들어갈 자리입니다. (현재는 확실하지 않으므로 원기둥으로 대체)
  return (
    <>
      {data.all_players_data.map((player) => {
        const isOffside = data.players.includes(player.id);
        // 팀에 따라 색상 부여 (0번 팀은 파란색, 1번 팀은 초록색)
        const teamColor = player.team === 0 ? "blue" : "green";
        
        return (
          <mesh key={player.id} position={[player.x / 100, 1, player.y / 100]}>
            <cylinderGeometry args={[0.3, 0.3, 2, 16]} />
            <meshStandardMaterial color={isOffside ? "red" : teamColor} />
          </mesh>
        );
      })}
    </>
  );
}

// 오프사이드 유리벽을 그리는 부품
function OffsideWall({ lineX }: { lineX: number }) {
  return (
    <mesh position={[lineX / 100, 2, 0]}>
      {/* 얇고 넓은 유리벽 형태 */}
      <boxGeometry args={[0.05, 4, 20]} />
      <meshStandardMaterial color="cyan" transparent={true} opacity={0.4} />
    </mesh>
  );
}

// 카메라 애니메이션 연출 부품
function CameraController({ triggerVAR }: { triggerVAR: boolean }) {
  useFrame((state) => {
    if (triggerVAR) {
      // VAR 버튼이 눌리면 카메라가 부드럽게 측면으로 이동 (추측성 애니메이션 로직)
      state.camera.position.lerp(new THREE.Vector3(10, 3, 5), 0.02);
      state.camera.lookAt(0, 1, 0);
    }
  });
  return null;
}

export default function ResultOverlay({ data }: ResultOverlayProps) {
  const [startVAR, setStartVAR] = React.useState(false);

  if (!data) return null;

  return (
    <div style={{ width: '100%', height: '500px', marginTop: '20px', position: 'relative' }}>
      <button 
        onClick={() => setStartVAR(true)}
        style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, padding: '10px', background: 'darkred', color: 'white', fontWeight: 'bold' }}
      >
        VAR 확인 (시점 이동)
      </button>

      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 5, 15]} />
        <OrbitControls />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        
        {/* 파란색 스튜디오 배경 */}
        <color attach="background" args={['#2a4b7c']} />
        
        {/* 바닥 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#1e3a5f" />
        </mesh>

        <Players data={data} />
        <OffsideWall lineX={data.offside_line} />
        <CameraController triggerVAR={startVAR} />
      </Canvas>
    </div>
  );
}
