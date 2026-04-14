import { Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { Sky, Environment } from '@react-three/drei';
import { Level } from './Level';
import { Ball } from './Ball';
import { useStore, COURSES } from '../store';
import * as THREE from 'three';

function CameraFollow() {
  const { ballPosition, currentCourse } = useStore();
  const course = COURSES[currentCourse];

  useFrame((state) => {
    // We want the camera to be behind and above the ball
    // Target position: ballPosition + [0, 15, 20]
    const targetPos = new THREE.Vector3(ballPosition[0], ballPosition[1] + 15, ballPosition[2] + 20);
    
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

export function GameCanvas() {
  const { gameState, backgroundTheme } = useStore();
  const preset = backgroundTheme === 'desert' ? 'sunset' : backgroundTheme === 'trees' ? 'forest' : 'dawn';

  return (
    <div className="absolute inset-0 bg-[#87CEEB]">
      <Canvas shadows camera={{ position: [0, 10, 20], fov: 50 }}>
        <CameraFollow />
        <Suspense fallback={null}>
          <Environment background preset={preset} blur={0.8} />
        </Suspense>
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

