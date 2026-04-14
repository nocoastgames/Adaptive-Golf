import { Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { Sky } from '@react-three/drei';
import { Level } from './Level';
import { Ball } from './Ball';
import { useStore, COURSES } from '../store';
import * as THREE from 'three';

function CameraFollow() {
  const { ballPosition, currentCourse, strokesThisHole } = useStore();
  const course = COURSES[currentCourse];

  useFrame((state) => {
    // Zoom out more on the first stroke
    const zoomHeight = strokesThisHole === 0 ? 25 : 15;
    const zoomBack = strokesThisHole === 0 ? 35 : 20;

    // Target position
    const targetPos = new THREE.Vector3(ballPosition[0], ballPosition[1] + zoomHeight, ballPosition[2] + zoomBack);
    
    // Smoothly interpolate camera position
    state.camera.position.lerp(targetPos, 0.05);
    
    // Look at a point between the ball and the hole to keep both in view
    const holeVec = new THREE.Vector3(course.holePos[0], course.holePos[1], course.holePos[2]);
    const ballVec = new THREE.Vector3(ballPosition[0], ballPosition[1], ballPosition[2]);
    
    // Look 70% towards the hole, 30% towards the ball
    const lookAtPos = ballVec.clone().lerp(holeVec, 0.7);
    
    state.camera.lookAt(lookAtPos);
  });

  return null;
}

function ThemeBackground() {
  const { backgroundTheme } = useStore();
  
  const distantPositions = useMemo(() => {
    return Array.from({ length: 40 }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 150 + Math.random() * 200;
      return [Math.cos(angle) * radius, -5, Math.sin(angle) * radius] as [number, number, number];
    });
  }, []);

  if (backgroundTheme === 'desert') {
    return (
      <group>
        <Sky sunPosition={[100, 20, 100]} turbidity={10} rayleigh={3} />
        <mesh position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1000, 1000]} />
          <meshBasicMaterial color="#E0C097" />
        </mesh>
        {distantPositions.map((pos, i) => (
          <mesh key={i} position={pos}>
            <coneGeometry args={[15 + Math.random() * 15, 20 + Math.random() * 20, 4]} />
            <meshBasicMaterial color="#D4A373" />
          </mesh>
        ))}
      </group>
    );
  }
  
  if (backgroundTheme === 'trees') {
    return (
      <group>
        <Sky sunPosition={[50, 50, -50]} turbidity={5} rayleigh={1} />
        <mesh position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1000, 1000]} />
          <meshBasicMaterial color="#2D4C1E" />
        </mesh>
        {distantPositions.map((pos, i) => (
          <mesh key={i} position={pos}>
            <coneGeometry args={[8 + Math.random() * 8, 20 + Math.random() * 30, 8]} />
            <meshBasicMaterial color="#1B3A0F" />
          </mesh>
        ))}
      </group>
    );
  }
  
  if (backgroundTheme === 'ocean') {
    return (
      <group>
        <Sky sunPosition={[0, 5, -100]} turbidity={2} rayleigh={0.5} />
        <mesh position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1000, 1000]} />
          <meshBasicMaterial color="#006994" />
        </mesh>
        {distantPositions.slice(0, 15).map((pos, i) => (
          <mesh key={i} position={pos}>
            <sphereGeometry args={[20 + Math.random() * 30, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshBasicMaterial color="#2E8B57" />
          </mesh>
        ))}
      </group>
    );
  }
  
  return null;
}

export function GameCanvas() {
  const { gameState } = useStore();

  return (
    <div className="absolute inset-0 bg-[#87CEEB]">
      <Canvas shadows camera={{ position: [0, 10, 20], fov: 50 }}>
        <CameraFollow />
        <ThemeBackground />
        <ambientLight intensity={0.5} />
        <directionalLight
          castShadow
          position={[10, 20, 10]}
          intensity={1.5}
          shadow-mapSize={[2048, 2048]}
        >
          <orthographicCamera attach="shadow-camera" args={[-20, 20, 20, -20]} />
        </directionalLight>

        {/* We only need physics when playing */}
        {gameState !== 'title' && 
         gameState !== 'setup_players' && 
         gameState !== 'setup_names' && 
         gameState !== 'course_intro' && (
          <Physics gravity={[0, -20, 0]}>
            <Level />
            <Ball />
          </Physics>
        )}
      </Canvas>
    </div>
  );
}

