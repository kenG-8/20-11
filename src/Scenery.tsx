import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { seeded } from './bookArt';
import { keepsakes, type Burst, type Keepsake, type Phase } from './data';
import { Voxels } from './VoxelBook';

const shelfVoxels = (() => {
  const blocks: Parameters<typeof Voxels>[0]['voxels'] = [];
  const random = seeded(2011);
  const put = (x: number, y: number, z: number, width: number, height: number, depth: number, color: string) => {
    blocks.push({ position: [x, y, z], size: [width, height, depth], color });
  };
  const colors = ['#203653', '#2a3f57', '#364056', '#554241', '#534337', '#243650', '#3a4556', '#5b4541'];
  for (const side of [-1, 1]) {
    for (let bay = 0; bay < 4; bay++) {
      const middle = side * (3.38 + bay * 1.88);
      const depth = -4 + bay * .14;
      put(middle, .73, depth - .16, 1.82, 8.4, .14, '#17243c');
      for (const post of [-1, 1]) {
        put(middle + post * .91, .73, depth + .15, .11, 8.4, .44, '#3b3c46');
        put(middle + post * .91, .73, depth + .39, .03, 8.2, .04, '#514739');
      }
      for (let row = 0; row < 7; row++) {
        const base = -3.26 + row * 1.25;
        put(middle, base, depth + .10, 1.82, .11, .62, '#4e423d');
        put(middle, base - .064, depth + .4, 1.82, .025, .04, '#635341');
        let x = middle - .81 + random() * .09;
        while (x < middle + .64) {
          const width = .075 + random() * .11;
          const height = .37 + random() * .64;
          const front = depth + .16 + random() * .19;
          const color = colors[Math.floor(random() * colors.length)];
          put(x + width / 2, base + .055 + height / 2, front - .16, width, height, .32, color);
          for (const offset of [.16, .78]) {
            if (random() > .39) put(x + width / 2, base + .055 + height * offset, front + .006, width * .74, .016, .014, '#7e6750');
          }
          x += width + .014 + random() * .047;
        }
      }
    }
  }
  for (let index = 0; index < 15; index++) {
    const y = -3.3 + index * .57;
    const width = index < 10 ? 2.47 : Math.max(.4, 2.47 - (index - 9) * .4);
    put(-width, y, -5.7, .15, .58, .43, '#52473c');
    put(width, y, -5.7, .15, .58, .43, '#52473c');
  }
  for (let index = 0; index < 18; index++) {
    put(0, -3.46, -7 + index * .82, 32, .019, .014, '#263148');
    put(-12.4 + index * 1.45, -3.45, -.8, .014, .018, 16, '#29334b');
  }
  return blocks;
})();

export function Library() {
  return <group>
    <ambientLight intensity={.91} color="#aebff5" />
    <directionalLight castShadow position={[-4, 6, 8]} intensity={2.2} color="#ffe2ae" shadow-mapSize={[1024, 1024]} shadow-bias={-.0007} shadow-normalBias={.025} />
    <directionalLight position={[4, -2, 4]} intensity={.85} color="#7c9ed9" />
    <pointLight position={[0, 2, -3.36]} color="#f7b56b" intensity={31} distance={8} />
    <Voxels voxels={shelfVoxels} />
    <mesh receiveShadow position={[0, -3.5, -1]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[42, 30]} />
      <meshStandardMaterial color="#18233b" roughness={.84} />
    </mesh>
    <mesh position={[0, 0, -7]}>
      <planeGeometry args={[36, 18]} />
      <meshBasicMaterial color="#10172b" />
    </mesh>
  </group>;
}

const spritePatterns: Record<Exclude<Keepsake['id'], 'plane'>, string[]> = {
  star: ['0001000', '0001000', '0012100', '1123211', '0012100', '0001000', '0001000'],
  flower: ['0010100', '0121210', '0123210', '0012100', '0004000', '0044000', '0004400', '0004000'],
  butterfly: ['1100011', '1220221', '1223221', '0113110', '0123210', '0110110'],
  crystal: ['0001000', '0012100', '0123210', '0123210', '0123210', '0012100', '0001000'],
};

const spriteVoxels = Object.fromEntries(Object.entries(spritePatterns).map(([kind, pattern]) => {
  const main = keepsakes.find(item => item.id === kind)!.color;
  const shade = '#' + new THREE.Color(main).multiplyScalar(.5).getHexString();
  const palette = [null, shade, main, '#fff1c9', '#85bb97'];
  return [kind, pattern.flatMap((line, row) => [...line].flatMap((pixel, column) => {
    const color = palette[Number(pixel)];
    return color ? [{ position: [(column - 3) * .092, ((pattern.length - 1) / 2 - row) * .092, 0], size: [.09, .09, .08 + Number(pixel) * .018], color }] : [];
  }))];
})) as Record<Exclude<Keepsake['id'], 'plane'>, Parameters<typeof Voxels>[0]['voxels']>;

const plane = new THREE.BufferGeometry();
plane.setAttribute('position', new THREE.Float32BufferAttribute([
  -.38, -.10, 0, .40, .25, 0, -.07, -.09, .095,
  .40, .25, 0, .01, -.335, .025, -.07, -.09, .095,
  -.07, -.09, .095, .01, -.335, .025, -.09, -.26, -.02,
], 3));
plane.computeVertexNormals();

function anchor(index: number, width: number, height: number, small: boolean, phase: Phase) {
  const desktop = [[-.255, .105], [-.22, -.218], [.258, .118], [.235, -.215], [.163, .24]];
  const mobile = [[-.34, .087], [-.33, -.25], [.34, .085], [.33, -.25], [.31, .2]];
  const [x, y] = (small ? mobile : desktop)[index];
  return [width * x, height * (y + (phase === 'reading' ? .025 : 0))] as const;
}

function Sprite({ item, index, phase, active, found, onSelect, reduced }: { item: Keepsake; index: number; phase: Phase; active: boolean; found: boolean; onSelect?: () => void; reduced: boolean }) {
  const group = useRef<THREE.Group>(null!);
  const target = useRef<THREE.Mesh>(null!);
  const hovering = useRef(false);
  const { size, viewport } = useThree();
  useFrame(({ clock }, delta) => {
    const time = clock.elapsedTime;
    const small = size.width < 650;
    const [x, y] = anchor(index, viewport.width, viewport.height, small, phase);
    group.current.position.set(x, y + (reduced ? 0 : Math.sin(time * 1.49 + index * 2.65) * .12), -.42);
    group.current.rotation.set(.13, reduced ? 0 : Math.sin(time * (item.id === 'butterfly' ? 4.6 : .8) + index) * .48, (index - 2) * .12);
    const scale = (small ? .70 : .84) * Math.min(1, viewport.height / 6) * (hovering.current || active ? 1.29 : 1);
    group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, scale, 8, delta));
    target.current?.scale.setScalar(found ? .86 : 1);
  });
  return <group ref={group}>
    {onSelect && <mesh ref={target} onPointerOver={(event) => { event.stopPropagation(); hovering.current = true; }}
      onPointerOut={() => { hovering.current = false; }} onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      <sphereGeometry args={[.61, 12, 8]} />
      <meshBasicMaterial visible={false} />
    </mesh>}
    {item.id === 'plane'
      ? <mesh geometry={plane} dispose={null}><meshStandardMaterial color={item.color} side={THREE.DoubleSide} emissive="#eda94f" emissiveIntensity={.2} /></mesh>
      : <Voxels voxels={spriteVoxels[item.id]} glow={active ? .58 : .24} metal={.16} />}
  </group>;
}

export function InteractiveObjects({ phase, active, found, onSelect, reduced }: { phase: Phase; active?: Keepsake; found: Set<string>; onSelect: (item: Keepsake) => void; reduced: boolean }) {
  return <group>
    {(phase === 'intro' || phase === 'reading') && keepsakes.map((item, index) =>
      <Sprite key={item.id} index={index} item={item} phase={phase} active={active?.id === item.id} found={found.has(item.id)} onSelect={() => onSelect(item)} reduced={reduced} />)}
    {phase === 'final' && [0, 1, 2, 3].map(index =>
      <Sprite key={index} index={index} item={keepsakes[1]} phase={phase} active={false} found={false} reduced={reduced} />)}
  </group>;
}

function AmbientDust({ reduced }: { reduced: boolean }) {
  const points = useRef<THREE.Points>(null!);
  const data = useMemo(() => {
    const random = seeded(52);
    const createCloud = (count: number) => Float32Array.from({ length: count * 3 }, (_, index) => {
      const axis = index % 3;
      return axis === 0 ? (random() - .5) * 28 : axis === 1 ? (random() - .5) * 12 : random() * 7 - 5;
    });
    return [createCloud(270), createCloud(57)];
  }, []);
  useFrame(({ clock }) => {
    points.current.rotation.z = reduced ? 0 : clock.elapsedTime * .008;
    points.current.position.y = reduced ? 0 : Math.sin(clock.elapsedTime * .34) * .32;
  });
  return <group>
    {data.map((positions, index) => <points key={index} ref={index === 0 ? points : undefined}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial color={index ? '#f9ca7b' : '#ba9a6a'} size={index ? .037 : .019} depthWrite={false} transparent opacity={index ? .8 : .58} />
    </points>)}
  </group>;
}

function SparkBurst({ burst, phase, reduced }: { burst: Burst; phase: Phase; reduced: boolean }) {
  const { viewport, size } = useThree();
  const material = useRef<THREE.PointsMaterial>(null!);
  const elapsed = useRef(0);
  const itemIndex = keepsakes.findIndex(keep => keep.id === burst.kind);
  const [x, y] = itemIndex < 0 ? [0, -.14] : anchor(itemIndex, viewport.width, viewport.height, size.width < 650, phase);
  const total = reduced ? 16 : itemIndex < 0 ? 185 : 75;
  const data = useMemo(() => {
    const random = seeded(120 + burst.id);
    const sources = Array.from({ length: total }, () => ({
      angle: random() * Math.PI * 2, speed: .48 + random() * (itemIndex < 0 ? 4.38 : 1.64),
      depth: (random() - .5) * 2.8, lag: random() * .18, spin: random() * 1.7,
    }));
    return { sources, positions: new Float32Array(total * 3), geometry: new THREE.BufferGeometry() };
  }, [burst.id, itemIndex, total]);
  useEffect(() => {
    data.geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3).setUsage(THREE.DynamicDrawUsage));
    return () => data.geometry.dispose();
  }, [data]);
  useFrame((_, delta) => {
    elapsed.current += delta;
    const time = elapsed.current;
    material.current.opacity = Math.max(0, 1 - time / (reduced ? .42 : 1.65));
    if (material.current.opacity === 0) return;
    for (const [index, source] of data.sources.entries()) {
      const distance = Math.max(0, time - source.lag);
      const spread = source.speed * distance * (reduced ? .25 : 1);
      const wave = Math.sin(distance * 6 + source.angle * 2) * distance * .32;
      let offsetX = Math.cos(source.angle) * spread;
      let offsetY = Math.sin(source.angle) * spread - distance * distance * .4;
      if (burst.kind === 'flower') offsetY *= .5 + Math.sin(source.angle * 5) * .34;
      if (burst.kind === 'butterfly') offsetX += wave;
      if (burst.kind === 'crystal') offsetY *= 1.9;
      if (burst.kind === 'plane') { offsetX += distance * 1.8; offsetY += distance * .8; }
      if (burst.kind === 'star') { offsetX *= 1 + Math.cos(source.angle * 4) * .3; offsetY *= 1 + Math.cos(source.angle * 4) * .3; }
      data.positions.set([x + offsetX, y + offsetY, .54 + source.depth * distance], index * 3);
    }
    data.geometry.attributes.position.needsUpdate = true;
  });
  return <points geometry={data.geometry} frustumCulled={false}>
    <pointsMaterial ref={material} color={keepsakes[itemIndex]?.color ?? '#ffca66'} size={burst.kind === 'final' ? .062 : .05} depthWrite={false} transparent opacity={0} blending={THREE.AdditiveBlending} />
  </points>;
}

function Petals({ reduced }: { reduced: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const { viewport } = useThree();
  const transform = useMemo(() => new THREE.Object3D(), []);
  const data = useMemo(() => {
    const random = seeded(11);
    return Array.from({ length: 62 }, () => [random() - .5, random(), random() * 2.6 - 1, .4 + random() * .5, random() * Math.PI * 2]);
  }, []);
  useFrame(({ clock }) => {
    const time = reduced ? 0 : clock.elapsedTime;
    for (const [index, [x, y, z, speed, spin]] of data.entries()) {
      transform.position.set(x * viewport.width + Math.sin(time * .7 + spin) * .53, viewport.height * (.51 - ((y + time * speed * .15) % 1)), z);
      transform.rotation.set(time + spin, time * .57 + spin, spin);
      transform.scale.setScalar(.66 + speed * .56);
      transform.updateMatrix();
      mesh.current.setMatrixAt(index, transform.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={mesh} args={[undefined, undefined, data.length]} frustumCulled={false}>
    <boxGeometry args={[.095, .047, .025]} />
    <meshStandardMaterial color="#ffaba2" emissive="#cb6b66" emissiveIntensity={.28} roughness={.81} />
  </instancedMesh>;
}

export function ParticleSystem({ phase, burst, reduced }: { phase: Phase; burst: Burst | null; reduced: boolean }) {
  return <>
    <AmbientDust reduced={reduced} />
    {burst && <SparkBurst key={burst.id} burst={burst} phase={phase} reduced={reduced} />}
    {phase === 'final' && <Petals reduced={reduced} />}
  </>;
}
