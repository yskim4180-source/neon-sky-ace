
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GameStatus } from '../types';

interface NeonSkyAceProps {
  status: GameStatus;
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
  onComboUpdate: (combo: number) => void;
}

enum EnemyType {
  BASIC,
  SEEKER, 
  GOLIATH 
}

type Enemy = THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhongMaterial> & {
  enemyType: EnemyType;
  hp: number;
};

export const NeonSkyAce: React.FC<NeonSkyAceProps> = ({ status, onGameOver, onScoreUpdate, onComboUpdate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef(0);
  const comboRef = useRef(1);
  const killCountInWindow = useRef(0);
  const comboWindowTimer = useRef(0);
  const statusRef = useRef(status);
  const shakeIntensity = useRef(0);

  useEffect(() => {
    statusRef.current = status;
    if (status === GameStatus.PLAYING) {
      scoreRef.current = 0;
      comboRef.current = 1;
      killCountInWindow.current = 0;
      onScoreUpdate(0);
      onComboUpdate(1);
    }
  }, [status, onScoreUpdate, onComboUpdate]);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a001a);
    scene.fog = new THREE.FogExp2(0x1a0033, 0.0025);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
    const cameraBasePos = new THREE.Vector3(0, 10, 25);
    camera.position.copy(cameraBasePos);

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // --- POST PROCESSING ---
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      2.2, // Stronger glow for that image look
      0.5, // Radius
      0.3  // Threshold
    );
    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0x4020a0, 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffaa00, 1.5);
    sunLight.position.set(0, 50, -500);
    scene.add(sunLight);

    const flashLight = new THREE.PointLight(0xff00ff, 0, 120);
    scene.add(flashLight);

    // --- ENVIRONMENT ---
    // Floor Grid
    const gridGeometry = new THREE.PlaneGeometry(3500, 3500, 120, 120);
    const gridMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const grid = new THREE.Mesh(gridGeometry, gridMaterial);
    grid.rotation.x = -Math.PI / 2;
    scene.add(grid);

    // Synthwave Sun (Large and detailed)
    const sunGroup = new THREE.Group();
    const sunColor = 0xff3300;
    const sunSecondary = 0xffcc00;
    
    for (let i = 0; i < 12; i++) {
      const segWidth = 100 - (i * 2);
      const segHeight = 10 - (i * 0.5);
      const geo = new THREE.BoxGeometry(200, segHeight, 1);
      const mat = new THREE.MeshBasicMaterial({ 
        color: i < 6 ? sunColor : sunSecondary,
        transparent: true,
        opacity: 1.0 - (i * 0.05)
      });
      const segment = new THREE.Mesh(geo, mat);
      segment.position.y = i * (segHeight + 5) - 60;
      segment.scale.x = Math.sqrt(1 - Math.pow((segment.position.y / 100), 2)) || 0.1;
      sunGroup.add(segment);
    }
    sunGroup.position.set(0, 200, -1200);
    sunGroup.scale.set(10, 10, 1);
    scene.add(sunGroup);

    // Stars
    const starGeometry = new THREE.BufferGeometry();
    const starVertices = [];
    for (let i = 0; i < 8000; i++) {
      starVertices.push(THREE.MathUtils.randFloatSpread(5000), THREE.MathUtils.randFloat(0, 2500), THREE.MathUtils.randFloatSpread(5000));
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 0.6 })));

    // --- THE JET (Rebuilt to match image) ---
    const jetGroup = new THREE.Group();
    
    // Stealth-style fuselage
    const jetMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x00d4ff, 
      emissive: 0x004455, 
      emissiveIntensity: 0.5,
      metalness: 0.9, 
      roughness: 0.1, 
      flatShading: true 
    });
    
    const cockpitMaterial = new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 1, roughness: 0 });

    // Fuselage
    const fuseGeo = new THREE.ConeGeometry(1.5, 6, 4);
    const fuse = new THREE.Mesh(fuseGeo, jetMaterial);
    fuse.rotation.x = Math.PI / 2;
    fuse.scale.set(1.5, 1, 0.8);
    jetGroup.add(fuse);

    // Cockpit
    const cockGeo = new THREE.BoxGeometry(1.2, 0.6, 2.5);
    const cockpit = new THREE.Mesh(cockGeo, cockpitMaterial);
    cockpit.position.set(0, 0.5, -1);
    jetGroup.add(cockpit);

    // Sweep-back Wings
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(10, -5);
    wingShape.lineTo(10, -9);
    wingShape.lineTo(0, -3);
    wingShape.lineTo(0, 0);
    
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.15, bevelEnabled: false });
    const lWing = new THREE.Mesh(wingGeo, jetMaterial);
    lWing.rotation.x = Math.PI / 2;
    lWing.position.set(0, 0, 1.5);
    jetGroup.add(lWing);

    const rWing = lWing.clone();
    rWing.scale.x = -1;
    jetGroup.add(rWing);

    // Magenta Neon Strips on Wings
    const neonMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
    const stripGeo = new THREE.BoxGeometry(8, 0.1, 0.3);
    const lStrip = new THREE.Mesh(stripGeo, neonMat);
    lStrip.position.set(6, 0.1, 2.5);
    lStrip.rotation.z = -0.45;
    jetGroup.add(lStrip);

    const rStrip = lStrip.clone();
    rStrip.position.x = -6;
    rStrip.rotation.z = 0.45;
    jetGroup.add(rStrip);

    // Vertical Stabilizers (Fins)
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(0, 3);
    finShape.lineTo(-1.5, 3);
    finShape.lineTo(-2.5, 0);
    const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.1, bevelEnabled: false });
    
    const lFin = new THREE.Mesh(finGeo, jetMaterial);
    lFin.position.set(1, 0, 2);
    lFin.rotation.y = 0.3;
    jetGroup.add(lFin);

    const rFin = lFin.clone();
    rFin.position.x = -1;
    rFin.rotation.y = -0.3;
    jetGroup.add(rFin);

    // Twin Engine Pods
    const engineGeo = new THREE.CylinderGeometry(0.8, 1.0, 1.5, 16);
    const lEng = new THREE.Mesh(engineGeo, jetMaterial);
    lEng.rotation.x = Math.PI / 2;
    lEng.position.set(1.2, 0, 3.2);
    jetGroup.add(lEng);

    const rEng = lEng.clone();
    rEng.position.x = -1.2;
    jetGroup.add(rEng);

    // Exhaust Glows (Thrusters)
    const thrusterGeo = new THREE.SphereGeometry(0.7, 16, 16);
    const thrusterMat = new THREE.MeshBasicMaterial({ color: 0xffee88 });
    const lThruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    lThruster.position.set(1.2, 0, 4);
    jetGroup.add(lThruster);

    const rThruster = lThruster.clone();
    rThruster.position.x = -1.2;
    jetGroup.add(rThruster);

    jetGroup.scale.set(0.6, 0.6, 0.6);
    jetGroup.position.y = 10;
    scene.add(jetGroup);

    // --- GAME LOGIC OBJECTS ---
    const laserPool: THREE.Mesh[] = [];
    const enemyPool: Enemy[] = [];
    const activeLasers: THREE.Mesh[] = [];
    const activeEnemies: Enemy[] = [];
    const particles: THREE.Points[] = [];

    const getLaser = (offsetX: number) => {
      let laser = laserPool.pop();
      if (!laser) {
        laser = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff3333 }));
        laser.rotation.x = Math.PI / 2;
      }
      laser.position.copy(jetGroup.position);
      laser.position.x += offsetX;
      scene.add(laser);
      activeLasers.push(laser);
    };

    const getEnemy = () => {
      const type = Math.random() > 0.9 ? EnemyType.GOLIATH : (Math.random() > 0.7 ? EnemyType.SEEKER : EnemyType.BASIC);
      let enemy = enemyPool.pop();
      if (!enemy) {
        enemy = new THREE.Mesh(new THREE.IcosahedronGeometry(2.5, 0), new THREE.MeshPhongMaterial({ flatShading: true })) as Enemy;
      }
      enemy.enemyType = type;
      enemy.hp = type === EnemyType.GOLIATH ? 3 : 1;
      enemy.scale.setScalar(type === EnemyType.GOLIATH ? 4 : (type === EnemyType.SEEKER ? 1.8 : 1.4));
      const color = type === EnemyType.GOLIATH ? 0xff00ff : (type === EnemyType.SEEKER ? 0x00ffff : 0xffcc00);
      enemy.material.color.set(color);
      enemy.material.emissive.set(color);
      enemy.material.emissiveIntensity = 0.5;
      enemy.position.set(THREE.MathUtils.randFloatSpread(120), THREE.MathUtils.randFloat(5, 50), -1500);
      scene.add(enemy);
      activeEnemies.push(enemy);
    };

    const triggerExplosion = (pos: THREE.Vector3, color: number) => {
      shakeIntensity.current = 1.2;
      flashLight.position.copy(pos);
      flashLight.color.set(color);
      flashLight.intensity = 250;
      const count = 50;
      const geometry = new THREE.BufferGeometry();
      const posArr = new Float32Array(count * 3);
      const velArr = new Float32Array(count * 3);
      for(let i=0; i<count; i++) {
        posArr[i*3] = pos.x; posArr[i*3+1] = pos.y; posArr[i*3+2] = pos.z;
        velArr[i*3] = (Math.random() - 0.5) * 3;
        velArr[i*3+1] = (Math.random() - 0.5) * 3;
        velArr[i*3+2] = (Math.random() - 0.5) * 3;
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
      const p = new THREE.Points(geometry, new THREE.PointsMaterial({ color, size: 0.8, transparent: true }));
      (p as any).velocities = velArr; (p as any).life = 1.0;
      scene.add(p);
      particles.push(p);
    };

    // --- LOOP ---
    let frameId: number;
    let lastSpawn = 0;
    let lastFire = 0;
    const clock = new THREE.Clock();
    const mouse = { x: 0, y: 0 };
    window.addEventListener('mousemove', (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const time = performance.now();

      // Thruster Flicker
      const flicker = Math.random() * 0.4 + 0.8;
      lThruster.scale.setScalar(flicker);
      rThruster.scale.setScalar(flicker);
      lThruster.material.color.set(Math.random() > 0.5 ? 0xffcc00 : 0xffffff);
      rThruster.material.color.set(Math.random() > 0.5 ? 0xffcc00 : 0xffffff);

      const pulse = Math.pow(Math.sin(time * 0.002 * Math.PI), 4);
      gridMaterial.opacity = 0.2 + pulse * 0.2;

      if (statusRef.current === GameStatus.PLAYING) {
        // High-fidelity Flight Mechanics (Advanced Banking)
        const targetX = mouse.x * 50;
        const targetY = (mouse.y * 25) + 12;
        jetGroup.position.x += (targetX - jetGroup.position.x) * 0.1;
        jetGroup.position.y += (targetY - jetGroup.position.y) * 0.1;
        
        // Banking: max 45 degrees (PI/4)
        const targetBank = -mouse.x * (Math.PI / 4);
        const targetPitch = -mouse.y * (Math.PI / 8);
        jetGroup.rotation.z += (targetBank - jetGroup.rotation.z) * 0.08;
        jetGroup.rotation.x += (targetPitch - jetGroup.rotation.x) * 0.08;

        // Auto Fire
        if (time - lastFire > 120) {
          getLaser(-3); getLaser(3);
          lastFire = time;
        }

        // Spawning
        if (time - lastSpawn > 350) { getEnemy(); lastSpawn = time; }

        // Combo Logic
        if (time > comboWindowTimer.current && comboRef.current > 1) {
          comboRef.current = 1; onComboUpdate(1);
          killCountInWindow.current = 0;
        }

        // Processing
        for (let i = activeLasers.length - 1; i >= 0; i--) {
          const l = activeLasers[i];
          l.position.z -= 1000 * dt;
          if (l.position.z < -2000) {
            scene.remove(l);
            laserPool.push(activeLasers.splice(i, 1)[0]);
          }
        }

        for (let i = activeEnemies.length - 1; i >= 0; i--) {
          const e = activeEnemies[i];
          e.position.z += 350 * dt;
          e.rotation.y += 2 * dt;
          if (e.enemyType === EnemyType.SEEKER) e.position.x += (jetGroup.position.x - e.position.x) * 0.04;

          for (let j = activeLasers.length - 1; j >= 0; j--) {
            const l = activeLasers[j];
            if (l.position.distanceTo(e.position) < (e.enemyType === EnemyType.GOLIATH ? 10 : 6)) {
              e.hp--;
              scene.remove(l);
              laserPool.push(activeLasers.splice(j, 1)[0]);
              if (e.hp <= 0) {
                triggerExplosion(e.position, e.material.color.getHex());
                scene.remove(e);
                enemyPool.push(activeEnemies.splice(i, 1)[0]);
                killCountInWindow.current++;
                comboWindowTimer.current = time + 2000;
                if (killCountInWindow.current >= 5) { comboRef.current = 2; onComboUpdate(2); }
                scoreRef.current += (e.enemyType === EnemyType.GOLIATH ? 1000 : 100) * comboRef.current;
                onScoreUpdate(scoreRef.current);
              }
              break;
            }
          }

          if (e && jetGroup.position.distanceTo(e.position) < (e.enemyType === EnemyType.GOLIATH ? 10 : 6)) {
            onGameOver(scoreRef.current);
          }
          if (e && e.position.z > 100) {
            scene.remove(e);
            enemyPool.push(activeEnemies.splice(i, 1)[0]);
          }
        }

        grid.position.z = (grid.position.z + 250 * dt) % 30;
        flashLight.intensity *= 0.88;

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          const arr = p.geometry.attributes.position.array as Float32Array;
          const vel = (p as any).velocities;
          for(let j=0; j<arr.length; j++) arr[j] += vel[j];
          p.geometry.attributes.position.needsUpdate = true;
          (p as any).life -= 2.2 * dt;
          p.material.opacity = (p as any).life;
          if ((p as any).life <= 0) { scene.remove(p); particles.splice(i, 1); }
        }

        if (shakeIntensity.current > 0) {
          camera.position.x = cameraBasePos.x + (Math.random() - 0.5) * shakeIntensity.current;
          camera.position.y = cameraBasePos.y + (Math.random() - 0.5) * shakeIntensity.current;
          shakeIntensity.current *= 0.82;
        } else {
          camera.position.lerp(cameraBasePos, 0.1);
        }

      } else {
        // Menu Idle
        jetGroup.position.y = 12 + Math.sin(time * 0.001) * 4;
        jetGroup.rotation.y += 0.6 * dt;
        grid.position.z = (grid.position.z + 30 * dt) % 30;
      }

      composer.render();
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) containerRef.current.removeChild(renderer.domElement);
    };
  }, [onGameOver, onScoreUpdate, onComboUpdate]);

  return <div ref={containerRef} className="w-full h-full" />;
};
