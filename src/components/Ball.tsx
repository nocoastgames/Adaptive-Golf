import { useSphere } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { useStore, COURSES } from '../store';
import { audio } from '../audio';
import * as THREE from 'three';

export function Ball() {
  const { 
    gameState, 
    players, 
    currentCourse,
    currentPlayerIndex, 
    ballPosition, 
    aimAngle, 
    setAimAngle,
    powerLevel,
    setPowerLevel,
    ballStopped,
    gameSpeed
  } = useStore();

  const currentPlayer = players[currentPlayerIndex];
  const course = COURSES[currentCourse];

  const [ref, api] = useSphere(() => ({
    mass: 1,
    position: ballPosition,
    args: [0.5],
    material: { friction: 0.1, restitution: 0.5 },
    linearDamping: 0.3,
    angularDamping: 0.3,
  }));

  // Refs for animation loops
  const aimDirection = useRef(1); // 1 for right, -1 for left
  const powerDirection = useRef(1); // 1 for up, -1 for down
  const velocity = useRef([0, 0, 0]);
  const position = useRef([0, 0, 0]);
  const isRolling = useRef(false);
  const hasShot = useRef(false);
  const sinkingTime = useRef(0);
  const stopTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!api || !api.velocity || !api.position) return;
    const unsubVel = api.velocity.subscribe((v) => (velocity.current = v));
    const unsubPos = api.position.subscribe((p) => (position.current = p));
    return () => {
      unsubVel();
      unsubPos();
    };
  }, [api]);

  // Reset ball position when it changes in store (e.g., new player turn)
  useEffect(() => {
    if (!api || !api.position || !api.velocity || !api.angularVelocity) return;
    if (gameState === 'player_turn_start' || gameState === 'aiming') {
      api.position.set(ballPosition[0], ballPosition[1], ballPosition[2]);
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
      
      // Restore collisions
      if (api.collisionFilterGroup && api.collisionFilterMask) {
        api.collisionFilterGroup.set(1);
        api.collisionFilterMask.set(1);
      }

      hasShot.current = false;
      isRolling.current = false;
      sinkingTime.current = 0;
      if (stopTimer.current) {
        clearTimeout(stopTimer.current);
        stopTimer.current = null;
      }
    }
  }, [ballPosition, gameState, api]);

  useEffect(() => {
    return () => {
      if (stopTimer.current) {
        clearTimeout(stopTimer.current);
      }
    };
  }, []);

  // Handle shooting
  useEffect(() => {
    if (!api || !api.applyImpulse) return;
    if (gameState === 'rolling' && !hasShot.current) {
      hasShot.current = true;
      isRolling.current = true;
      
      // Calculate impulse based on aimAngle and powerLevel
      const force = (powerLevel / 100) * 80; // Max force 80
      const impulseX = Math.sin(aimAngle) * force;
      const impulseZ = -Math.cos(aimAngle) * force;
      
      api.applyImpulse([impulseX, 0, impulseZ], [0, 0, 0]);
    }
  }, [gameState, aimAngle, powerLevel, api]);

  // Handle sinking state
  useEffect(() => {
    if (!api || !api.velocity || !api.angularVelocity) return;
    if (gameState === 'sinking') {
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
      
      // Disable collisions so it can drop through the floor
      if (api.collisionFilterGroup && api.collisionFilterMask) {
        api.collisionFilterGroup.set(0);
        api.collisionFilterMask.set(0);
      }
      // We'll animate it down in useFrame
    }
  }, [gameState, api]);

  // Bounce sound
  useEffect(() => {
    const handleCollide = (e: any) => {
      if (gameState === 'rolling' && e.contact.impactVelocity > 2) {
        audio.playBounce();
      }
    };
    // We can't easily attach onCollide to useSphere after creation without re-creating it,
    // so we'll just skip bounce sounds for now to keep it simple, or we could add it to the useSphere config.
  }, [gameState]);

  useFrame((state, delta) => {
    if (gameState === 'aiming') {
      // Calculate base angle to hole
      const dx = course.holePos[0] - ballPosition[0];
      const dz = course.holePos[2] - ballPosition[2];
      const baseAngle = Math.atan2(dx, -dz); // Angle to hole

      // Sweep aim angle around the base angle (180 degree sweep)
      const speed = 1.5 * gameSpeed; // radians per second
      let newAngle = aimAngle + speed * delta * aimDirection.current;
      
      const maxAngle = baseAngle + Math.PI / 2;
      const minAngle = baseAngle - Math.PI / 2;
      
      if (newAngle > maxAngle) {
        newAngle = maxAngle;
        aimDirection.current = -1;
      } else if (newAngle < minAngle) {
        newAngle = minAngle;
        aimDirection.current = 1;
      }
      
      // If aimAngle is completely outside the range (e.g. first frame), snap it
      if (aimAngle < minAngle || aimAngle > maxAngle) {
        setAimAngle(baseAngle);
      } else {
        setAimAngle(newAngle);
      }
    }

    if (gameState === 'power') {
      // Sweep power between 0 and 100
      const speed = 150 * gameSpeed; // percent per second
      let newPower = powerLevel + speed * delta * powerDirection.current;
      
      if (newPower > 100) {
        newPower = 100;
        powerDirection.current = -1;
      } else if (newPower < 0) {
        newPower = 0;
        powerDirection.current = 1;
      }
      setPowerLevel(newPower);
    }

    if (gameState === 'rolling' && isRolling.current) {
      // Check if ball has stopped
      const speed = Math.sqrt(
        velocity.current[0] ** 2 + 
        velocity.current[1] ** 2 + 
        velocity.current[2] ** 2
      );

      if (speed < 0.08) {
        if (!stopTimer.current) {
          stopTimer.current = setTimeout(() => {
            if (useStore.getState().gameState !== 'rolling') return;
            
            isRolling.current = false;
            const p = position.current;
            // If it didn't fall off the map
            if (p[1] > -2) {
              ballStopped(false, [p[0], p[1], p[2]]);
            } else {
              // Fell off map, reset to previous position
              ballStopped(false, ballPosition);
            }
            stopTimer.current = null;
          }, 400);
        }
      } else {
        if (stopTimer.current) {
          clearTimeout(stopTimer.current);
          stopTimer.current = null;
        }
      }

      if (position.current[1] < -5) {
        // Fell off map while rolling
        if (stopTimer.current) {
          clearTimeout(stopTimer.current);
          stopTimer.current = null;
        }
        isRolling.current = false;
        ballStopped(false, ballPosition);
      }
    }

    if (gameState === 'sinking') {
      sinkingTime.current += delta;
      
      // Move towards hole center and down
      const p = position.current;
      const targetX = course.holePos[0];
      const targetZ = course.holePos[2];
      const targetY = course.holePos[1] - 2; // Drop deeper below ground
      
      // Snap to X/Z center quickly, drop Y steadily
      const newX = THREE.MathUtils.lerp(p[0], targetX, 0.2);
      const newZ = THREE.MathUtils.lerp(p[2], targetZ, 0.2);
      const newY = THREE.MathUtils.lerp(p[1], targetY, 0.1);
      
      if (api && api.position && api.velocity) {
        api.position.set(newX, newY, newZ);
        api.velocity.set(0, 0, 0);
      }

      if (sinkingTime.current > 1.0) {
        // Done sinking faster
        ballStopped(true, [targetX, targetY, targetZ]);
      }
    }
  });

  // Calculate scale based on sinking
  const scale = gameState === 'sinking' ? Math.max(0, 1 - sinkingTime.current * 1.5) : 1;

  return (
    <group>
      <mesh ref={ref as any} name="ball" castShadow receiveShadow scale={[scale, scale, scale]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial 
          color={currentPlayer?.color || '#FFFFFF'} 
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* Aiming Arrow */}
      {(gameState === 'aiming' || gameState === 'power') && (
        <group position={ballPosition} rotation={[0, -aimAngle, 0]}>
          <mesh position={[0, 0.1, -4]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.5, 8]} />
            <meshBasicMaterial color="#FFFFFF" transparent opacity={0.5} />
          </mesh>
          <mesh position={[0, 0.1, -8]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.5, 3]} />
            <meshBasicMaterial color="#FFFFFF" transparent opacity={0.8} />
          </mesh>
        </group>
      )}
    </group>
  );
}
