import { useBox, useCylinder } from '@react-three/cannon';
import { useStore, COURSES } from '../store';
import { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function WindmillBlade() {
  const [ref1, api1] = useBox(() => ({
    type: 'Kinematic',
    position: [0, 3.5, -13.5],
    args: [9, 1.5, 0.5],
    collisionFilterGroup: 1,
  }));

  const [ref2, api2] = useBox(() => ({
    type: 'Kinematic',
    position: [0, 3.5, -13.5],
    args: [1.5, 9, 0.5],
    collisionFilterGroup: 1,
  }));

  useFrame((state) => {
    if (!api1 || !api2) return;
    const t = state.clock.getElapsedTime();
    const angle = t * 1.5;
    
    api1.rotation.set(0, 0, angle);
    api2.rotation.set(0, 0, angle);
  });

  return (
    <group>
      <mesh ref={ref1 as any} castShadow receiveShadow>
        <boxGeometry args={[9, 1.5, 0.5]} />
        <meshStandardMaterial color="#FF0055" />
      </mesh>
      <mesh ref={ref2 as any} castShadow receiveShadow>
        <boxGeometry args={[1.5, 9, 0.5]} />
        <meshStandardMaterial color="#FF0055" />
      </mesh>
      <mesh position={[0, 3.5, -13.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
    </group>
  );
}

function Windmill() {
  // Left wall
  useBox(() => ({ type: 'Static', position: [-3.25, 3.5, -15], args: [3.5, 7, 2] }));
  // Right wall
  useBox(() => ({ type: 'Static', position: [3.25, 3.5, -15], args: [3.5, 7, 2] }));
  // Top wall (above hole)
  useBox(() => ({ type: 'Static', position: [0, 5, -15], args: [3, 4, 2] }));

  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-5, 0);
    s.lineTo(5, 0);
    s.lineTo(3.5, 8);
    s.lineTo(-3.5, 8);
    s.lineTo(-5, 0);

    const hole = new THREE.Path();
    hole.moveTo(-1.5, 0);
    hole.lineTo(1.5, 0);
    hole.lineTo(1.5, 3);
    hole.lineTo(-1.5, 3);
    hole.lineTo(-1.5, 0);
    s.holes.push(hole);

    return s;
  }, []);

  return (
    <group>
      {/* Windmill Body */}
      <mesh position={[0, 0, -16]} castShadow receiveShadow>
        <extrudeGeometry args={[shape, { depth: 2, bevelEnabled: false }]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      
      {/* Windmill Blades */}
      <WindmillBlade />
    </group>
  );
}

function River() {
  const { waterHazard } = useStore();
  
  // Left river trigger
  useBox(() => ({
    isTrigger: true,
    position: [-10, 0, 5],
    args: [10, 2, 10],
    onCollide: (e) => {
      if (e.body.name === 'ball' && useStore.getState().gameState === 'rolling') {
        waterHazard();
      }
    }
  }));

  // Right river trigger
  useBox(() => ({
    isTrigger: true,
    position: [10, 0, 5],
    args: [10, 2, 10],
    onCollide: (e) => {
      if (e.body.name === 'ball' && useStore.getState().gameState === 'rolling') {
        waterHazard();
      }
    }
  }));

  return (
    <group>
      {/* Left Water Visual */}
      <mesh position={[-10, -0.4, 5]} receiveShadow>
        <boxGeometry args={[10, 1.1, 10]} />
        <meshStandardMaterial color="#00AAFF" transparent opacity={0.8} />
      </mesh>
      {/* Right Water Visual */}
      <mesh position={[10, -0.4, 5]} receiveShadow>
        <boxGeometry args={[10, 1.1, 10]} />
        <meshStandardMaterial color="#00AAFF" transparent opacity={0.8} />
      </mesh>
      {/* Bridge Visual (flush with ground) */}
      <mesh position={[0, 0.01, 5]} receiveShadow castShadow>
        <boxGeometry args={[10, 0.1, 10]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
    </group>
  );
}

function Course0() {
  useBox(() => ({ type: 'Static', position: [-9, 0.5, 15], args: [12, 2, 2] }));
  useBox(() => ({ type: 'Static', position: [9, 0.5, 15], args: [12, 2, 2] }));
  useBox(() => ({ type: 'Static', position: [-10, 0.5, 0], args: [12, 2, 2], rotation: [0, Math.PI / 4, 0] }));
  useBox(() => ({ type: 'Static', position: [10, 0.5, 0], args: [12, 2, 2], rotation: [0, -Math.PI / 4, 0] }));

  return (
    <group>
      <mesh position={[-9, 0.5, 15]} receiveShadow castShadow>
        <boxGeometry args={[12, 2, 2]} />
        <meshStandardMaterial color="#FF00FF" />
      </mesh>
      <mesh position={[9, 0.5, 15]} receiveShadow castShadow>
        <boxGeometry args={[12, 2, 2]} />
        <meshStandardMaterial color="#FF00FF" />
      </mesh>
      <mesh position={[-10, 0.5, 0]} rotation={[0, Math.PI / 4, 0]} receiveShadow castShadow>
        <boxGeometry args={[12, 2, 2]} />
        <meshStandardMaterial color="#00FFFF" />
      </mesh>
      <mesh position={[10, 0.5, 0]} rotation={[0, -Math.PI / 4, 0]} receiveShadow castShadow>
        <boxGeometry args={[12, 2, 2]} />
        <meshStandardMaterial color="#00FFFF" />
      </mesh>
    </group>
  );
}

function Course1() {
  const angle = Math.atan(4 / 20);
  const length = Math.sqrt(20 * 20 + 4 * 4);
  
  // To make the top surface perfectly flush at y=0 (z=10) and y=4 (z=-10):
  // The center of the top surface is at y=2, z=0.
  // The center of the box is offset by -0.5 along the local Y axis (normal to the surface).
  const cy = 2 - 0.5 * Math.cos(angle);
  const cz = 0 - 0.5 * Math.sin(angle);

  useBox(() => ({ type: 'Static', position: [0, cy, cz], args: [30, 1, length], rotation: [angle, 0, 0] }));
  
  // Platform from z=-10 to z=-40. Center at z=-25.
  // Top is at y=4. If height is 8, center y is 0.
  useBox(() => ({ type: 'Static', position: [0, 0, -25], args: [30, 8, 30] }));

  return (
    <group>
      <mesh position={[0, cy, cz]} rotation={[angle, 0, 0]} receiveShadow castShadow>
        <boxGeometry args={[30, 1, length]} />
        <meshStandardMaterial color="#22AA22" />
      </mesh>
      <mesh position={[0, 0, -25]} receiveShadow castShadow>
        <boxGeometry args={[30, 8, 30]} />
        <meshStandardMaterial color="#118811" />
      </mesh>
    </group>
  );
}

function Course3() {
  // Start platform: z from 15 to 35. Top at y=10.
  useBox(() => ({ type: 'Static', position: [0, 5, 25], args: [30, 10, 20] }));
  // Middle platform: z from -5 to 15. Top at y=5.
  useBox(() => ({ type: 'Static', position: [0, 2.5, 5], args: [30, 5, 20] }));

  return (
    <group>
      <mesh position={[0, 5, 25]} receiveShadow castShadow>
        <boxGeometry args={[30, 10, 20]} />
        <meshStandardMaterial color="#55DD55" />
      </mesh>
      <mesh position={[0, 2.5, 5]} receiveShadow castShadow>
        <boxGeometry args={[30, 5, 20]} />
        <meshStandardMaterial color="#44CC44" />
      </mesh>
    </group>
  );
}

export function Level() {
  const { currentCourse, ballSinking } = useStore();
  const course = COURSES[currentCourse];
  const holeRadius = 2.5;

  // Base Ground
  useBox(() => ({
    type: 'Static',
    position: [0, -0.5, 0],
    args: [30, 1, 80],
    material: { friction: 0.1, restitution: 0.5 }
  }));

  // Walls
  useBox(() => ({ type: 'Static', position: [-15, 1, 0], args: [1, 10, 80] })); // Left
  useBox(() => ({ type: 'Static', position: [15, 1, 0], args: [1, 10, 80] })); // Right
  useBox(() => ({ type: 'Static', position: [0, 1, 40], args: [30, 10, 1] })); // Back
  useBox(() => ({ type: 'Static', position: [0, 1, -40], args: [30, 10, 1] })); // Front

  // Hole Trigger (Sensor)
  useCylinder(() => ({
    isTrigger: true,
    position: [course.holePos[0], course.holePos[1] + 0.5, course.holePos[2]],
    args: [holeRadius, holeRadius, 2, 16],
    onCollide: (e) => {
      if (e.body.name === 'ball' && useStore.getState().gameState === 'rolling') {
        useStore.getState().ballSinking();
      }
    }
  }));

  // Course Specifics
  // These are now handled by their respective components below

  return (
    <group>
      {/* Ground Visual */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[30, 1, 80]} />
        <meshStandardMaterial color="#33CC33" />
      </mesh>

      {/* Walls Visual */}
      <mesh position={[-15, 1, 0]} receiveShadow castShadow>
        <boxGeometry args={[1, 2, 80]} />
        <meshStandardMaterial color="#FF9900" />
      </mesh>
      <mesh position={[15, 1, 0]} receiveShadow castShadow>
        <boxGeometry args={[1, 2, 80]} />
        <meshStandardMaterial color="#FF9900" />
      </mesh>
      <mesh position={[0, 1, 40]} receiveShadow castShadow>
        <boxGeometry args={[30, 2, 1]} />
        <meshStandardMaterial color="#FF9900" />
      </mesh>
      <mesh position={[0, 1, -40]} receiveShadow castShadow>
        <boxGeometry args={[30, 2, 1]} />
        <meshStandardMaterial color="#FF9900" />
      </mesh>

      {/* Course Specifics */}
      {currentCourse === 0 && <Course0 />}
      {currentCourse === 1 && <Course1 />}
      {currentCourse === 2 && (
        <group>
          <River />
          <Windmill />
        </group>
      )}
      {currentCourse === 3 && <Course3 />}

      {/* Hole Visual */}
      <mesh position={course.holePos} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[holeRadius, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Flag Pole */}
      <mesh position={[course.holePos[0], course.holePos[1] + 2, course.holePos[2] - holeRadius - 0.5]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 4]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      {/* Flag */}
      <mesh position={[course.holePos[0] + 0.6, course.holePos[1] + 3.5, course.holePos[2] - holeRadius - 0.5]} castShadow>
        <boxGeometry args={[1.2, 0.8, 0.05]} />
        <meshStandardMaterial color="#FF0055" />
      </mesh>
    </group>
  );
}
