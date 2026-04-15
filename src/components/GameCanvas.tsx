import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { Environment } from '@react-three/drei';
import { Level } from './Level';
import { Ball } from './Ball';
import { useStore, COURSES } from '../store';
import * as THREE from 'three';

function CameraFollow() {
  const { ballPosition, currentCourse } = useStore();
  const course = COURSES[currentCourse];
  const lookAtTarget = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state) => {
    const holeVec = new THREE.Vector3(course.holePos[0], course.holePos[1], course.holePos[2]);
    const ballVec = new THREE.Vector3(ballPosition[0], ballPosition[1], ballPosition[2]);
    
    // Calculate midpoint and distance between ball and hole
    const mid = ballVec.clone().lerp(holeVec, 0.5);
    const dist = ballVec.distanceTo(holeVec);
    
    // Dynamic camera positioning to ensure both ball and hole are in view
    // Position relative to the ball, not the midpoint, so the ball is never cut off
    // Lowered multipliers to keep the camera closer, especially on the first shot
    const zoomHeight = Math.max(12, dist * 0.25);
    const zoomBack = Math.max(18, dist * 0.5);
    
    // Position camera behind the ball (towards +Z)
    const targetPos = new THREE.Vector3(
      ballVec.x,
      ballVec.y + zoomHeight,
      ballVec.z + zoomBack
    );
    
    // Smoothly interpolate camera position
    state.camera.position.lerp(targetPos, 0.05);
    
    // Smoothly interpolate the lookAt target
    // Look slightly ahead of the midpoint towards the hole
    const lookTarget = ballVec.clone().lerp(holeVec, 0.6);
    
    // Initialize it on first frame if it's 0,0,0
    if (lookAtTarget.current.lengthSq() === 0) {
      lookAtTarget.current.copy(lookTarget);
    } else {
      lookAtTarget.current.lerp(lookTarget, 0.05);
    }
    
    state.camera.lookAt(lookAtTarget.current);
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

