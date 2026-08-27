'use client';

import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface PlayerData {
  id: number;
  x: number;
  y: number; 
  team: number;
}

interface ResultData {
  offside_line: number;
  players: number[]; 
  all_players_data: PlayerData[];
}

interface ResultOverlayProps {
  data: ResultData | null;
}

function Players({ data }: { data: ResultData }) {
  return (
    <>
      {data.all_players_data.map((player) => {
        const isOffside = data.players.includes(player.id);
        const teamColor = player.team === 0 ? "blue" : "green";
        const finalColor = isOffside ? "red" : teamColor;
        
        return (
          <group key={player.id} position={[player.x / 100, 0, player.y / 100]}>
            
            {/* 1. 머리 */}
            <mesh position={[0, 1.6, 0]}>
              <sphereGeometry args={[0.18, 32, 32]} />
              <meshStandardMaterial color={finalColor} />
            </mesh>
            
            {/* 2. 몸통 */}
            <mesh position={[0, 0.9, 0]}>
              <capsuleGeometry args={[0.22, 0.6, 4, 16]} />
              <meshStandardMaterial color={finalColor} />
            </mesh>
            
            {/* 3. 왼쪽 다리 */}
            <mesh position={[-0.12, 0.4, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 0.8, 16]} />
              <meshStandardMaterial color={finalColor} />
            </mesh>
            
            {/* 4. 오른쪽 다리 */}
            <mesh position={[0.12, 0.4, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 0.8, 16]} />
              <meshStandardMaterial color={finalColor} />
            </mesh>
            
          </group>
        );
      })}
    </>
  );
}

function OffsideWall({ lineX }: { lineX: number }) {
  return (
    <mesh position={[lineX / 100, 2, 0]}>
      <boxGeometry args={[0.05, 4, 20]} />
      <meshStandardMaterial color="cyan" transparent={true} opacity={0.4} />
    </mesh>
  );
}

function CameraController({ triggerVAR }: { triggerVAR: boolean }) {
  useFrame((state) => {
    if (triggerVAR) {
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

        <color attach="background" args={['#2a4b7c']} />
        
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
