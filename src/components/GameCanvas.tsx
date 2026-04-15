import { Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { Environment } from '@react-three/drei';
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
  
  if (backgroundTheme === 'desert') {
    return (
      <Suspense fallback={null}>
        <Environment background files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/syferfontein_18d_clear_1k.hdr" />
      </Suspense>
    );
  }
  
  if (backgroundTheme === 'trees') {
    return (
      <Suspense fallback={null}>
        <Environment background files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/forest_slope_1k.hdr" />
      </Suspense>
    );
  }
  
  if (backgroundTheme === 'ocean') {
    return (
      <Suspense fallback={null}>
        <Environment background files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/cape_hill_1k.hdr" />
      </Suspense>
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

