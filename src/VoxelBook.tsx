import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import * as THREE from 'three';
import { BOOK_HEIGHT as height, BOOK_WIDTH as width, coverArt, paperArt } from './bookArt';
import { greetings, OPEN_SECONDS, TURN_SECONDS, type Phase, type Turn } from './data';

type Voxel = { position: [number, number, number]; size: [number, number, number]; color: string };

export function Voxels({ voxels, metal = 0, glow = 0 }: { voxels: Voxel[]; metal?: number; glow?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  useLayoutEffect(() => {
    const transform = new THREE.Object3D();
    const color = new THREE.Color();
    voxels.forEach((voxel, index) => {
      transform.position.set(...voxel.position);
      transform.scale.set(...voxel.size);
      transform.updateMatrix();
      mesh.current.setMatrixAt(index, transform.matrix);
      mesh.current.setColorAt(index, color.set(voxel.color));
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.instanceColor!.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [voxels]);
  return <instancedMesh ref={mesh} args={[undefined, undefined, voxels.length]}>
    <boxGeometry />
    <meshStandardMaterial metalness={metal} roughness={.48} emissive="#ffbf6c" emissiveIntensity={glow} />
  </instancedMesh>;
}

const gold = '#dca960';
const coverVoxels: Voxel[] = [];
const ornament = [
  '0000001000000', '0000011100000', '0000021200000',
  '0010011100100', '0111211121110', '1111111111111',
  '0111211121110', '0010011100100', '0000021200000',
  '0000011100000', '0000001000000',
];

ornament.forEach((row, rowIndex) => [...row].forEach((value, column) => {
  if (value === '0') return;
  coverVoxels.push({
    position: [width / 2 + (column - 6) * .082, .20 + (5 - rowIndex) * .082, .092],
    size: [.079, .079, value === '2' ? .036 : .07],
    color: value === '2' ? '#a9784d' : (rowIndex + column) % 4 === 0 ? '#ffdd9b' : '#edb66d',
  });
}));

for (const offsetX of [-1, 1]) {
  for (const offsetY of [-1, 1]) {
    for (const [column, row] of [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [0, 2], [0, 3], [1, 1], [2, 2], [3, 3]]) {
      coverVoxels.push({
        position: [width / 2 + offsetX * (1.13 - column * .054), offsetY * (1.37 - row * .054), .082],
        size: [.058, .058, .035],
        color: (column + row) % 3 === 0 ? '#f3c580' : gold,
      });
    }
  }
}

for (const [x, y, size] of [[-.68, .48, .044], [.69, .03, .042], [.48, .52, .036], [-.52, -.12, .037], [.73, .37, .023], [-.74, .06, .024]]) {
  coverVoxels.push({ position: [width / 2 + x, y, .095], size: [size, size, .04], color: '#ffdd9a' });
}

const pageEdges: Voxel[] = [];
for (let index = 0; index < 15; index++) {
  const depth = -.105 + index * .015;
  const color = index % 3 === 0 ? '#b18f61' : index % 2 === 0 ? '#eed0a2' : '#f4ddba';
  for (const sign of [-1, 1]) {
    pageEdges.push({ position: [width / 2, sign * (height / 2 - .09), depth], size: [width - .15, .012, .011], color });
  }
  pageEdges.push({ position: [width - .07, 0, depth], size: [.012, height - .18, .011], color });
}

function Binding({ face }: { face?: THREE.Texture }) {
  return <group>
    <RoundedBox castShadow args={[width + .12, height + .08, .15]} position={[width / 2, 0, 0]} radius={.035} smoothness={2}>
      <meshStandardMaterial color="#253954" roughness={.59} />
    </RoundedBox>
    <mesh position={[width / 2, 0, .077]}>
      <planeGeometry args={[width + .045, height + .025]} />
      <meshStandardMaterial map={face} color={face ? 'white' : '#1b2a46'} roughness={.62} emissiveMap={face} emissive="#ffffff" emissiveIntensity={face ? .08 : 0} />
    </mesh>
    {face && <Voxels voxels={coverVoxels} metal={.36} glow={.16} />}
  </group>;
}

function BookPage({ side, texture, onSelect }: { side: -1 | 1; texture: THREE.Texture; onSelect?: () => void }) {
  return <group rotation={[0, -side * .09, 0]}>
    <group position={[side * width / 2, 0, 0]}>
      <mesh castShadow>
        <boxGeometry args={[width - .13, height - .16, .225]} />
        <meshStandardMaterial color="#cbae83" roughness={.95} />
      </mesh>
      <group rotation={[0, side === -1 ? Math.PI : 0, 0]}>
        <group position={[-width / 2, 0, 0]}><Voxels voxels={pageEdges} /></group>
      </group>
      <mesh receiveShadow position={[0, 0, .114]} onClick={onSelect && ((event) => { event.stopPropagation(); onSelect(); })}>
        <planeGeometry args={[width - .135, height - .16]} />
        <meshStandardMaterial map={texture} roughness={1} emissiveMap={texture} emissive="#fff2de" emissiveIntensity={.06} />
      </mesh>
    </group>
  </group>;
}

function TurningSheet({ turn, page, textures, reduced }: { turn: Turn; page: number; textures: ReturnType<typeof makeTextures>; reduced: boolean }) {
  const hinge = useRef<THREE.Group>(null!);
  const progress = useMemo(() => ({ value: 0 }), []);
  const geometry = useMemo(() => new THREE.PlaneGeometry(width - .15, height - .16, 22, 1).translate(width / 2, 0, 0), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => {
    const animation = gsap.fromTo(progress, { value: 0 }, { value: 1, duration: reduced ? .11 : TURN_SECONDS, ease: 'sine.inOut' });
    return () => { animation.kill(); };
  }, [progress, reduced, turn]);
  useFrame(() => {
    const fraction = turn.direction === 1 ? progress.value : 1 - progress.value;
    hinge.current.rotation.y = THREE.MathUtils.lerp(-.09, -Math.PI + .09, fraction);
    const vertices = geometry.attributes.position;
    // Curl the free edge while the inner edge stays attached to the spine.
    for (let index = 0; index < vertices.count; index++) {
      const distance = vertices.getX(index) / width;
      vertices.setZ(index, Math.sin(fraction * Math.PI) * distance * distance * .35);
    }
    vertices.needsUpdate = true;
    geometry.computeVertexNormals();
  });
  const right = turn.direction === 1 ? page : page - 1;
  const left = turn.direction === 1 ? page + 1 : page;
  return <group ref={hinge} position={[0, 0, .15]} rotation={[0, turn.direction === 1 ? -.09 : -Math.PI + .09, 0]}>
    <mesh geometry={geometry} frustumCulled={false}>
      <meshStandardMaterial map={textures.right[right]} roughness={.92} />
    </mesh>
    <mesh geometry={geometry} frustumCulled={false}>
      <meshStandardMaterial map={textures.back[left]} side={THREE.BackSide} roughness={.92} />
    </mesh>
  </group>;
}

function makeTextures() {
  return {
    cover: coverArt(),
    left: greetings.map((_, index) => paperArt(index, 'left')),
    right: greetings.map((_, index) => paperArt(index, 'right')),
    back: greetings.map((_, index) => paperArt(index, 'left', true)),
  };
}

export function VoxelBook({ phase, page, turn, hovered, onOpen, onTurn, reduced, onOpeningFlash }: {
  phase: Phase; page: number; turn: Turn | null; hovered: boolean; reduced: boolean;
  onOpen: () => void; onTurn: (direction: -1 | 1) => void; onOpeningFlash: () => void;
}) {
  const book = useRef<THREE.Group>(null!);
  const origin = useRef<THREE.Group>(null!);
  const cover = useRef<THREE.Group>(null!);
  const leaf = useRef<THREE.Group>(null);
  const pulse = useRef<THREE.PointLight>(null!);
  const animation = useMemo(() => ({ spread: 0, leaf: 0, camera: 0, light: 0 }), []);
  const textures = useMemo(makeTextures, []);
  const { camera, viewport, size } = useThree();

  useEffect(() => () => {
    for (const texture of [textures.cover, ...textures.left, ...textures.right, ...textures.back]) texture.dispose();
  }, [textures]);

  useLayoutEffect(() => {
    if (phase !== 'opening') return;
    const duration = reduced ? .22 : OPEN_SECONDS;
    const timeline = gsap.timeline();
    // Move the camera first, then open the cover around the same hinge as the sheets.
    timeline.to(animation, { camera: 1, duration: duration * .8, ease: 'power2.inOut' }, 0)
      .to(animation, { spread: 1, duration: duration * .82, ease: 'power2.inOut' }, duration * .16)
      .to(animation, { leaf: 1, duration: duration * .70, ease: 'sine.inOut' }, duration * .29)
      .to(animation, { light: 1, duration: duration * .18, ease: 'power2.out' }, duration * .33)
      .call(onOpeningFlash, [], duration * .45)
      .to(animation, { light: 0, duration: duration * .44, ease: 'power2.out' }, duration * .54);
    return () => { timeline.kill(); };
  }, [phase, animation, reduced, onOpeningFlash]);

  useFrame(({ clock, pointer }, delta) => {
    const time = clock.elapsedTime;
    const small = size.width < 650;
    const spread = phase === 'reading' || phase === 'final' ? 1 : animation.spread;
    const zoom = phase === 'reading' || phase === 'final' ? 1 : animation.camera;
    const frameHeight = viewport.height;
    const closedScale = Math.min(frameHeight * (small ? .159 : .152), viewport.width * (small ? .26 : .30));
    const openScale = Math.min(frameHeight * .171, viewport.width * (small ? .166 : .172));
    const scale = THREE.MathUtils.lerp(closedScale, openScale, spread)
      * (hovered && phase === 'intro' && !reduced ? 1.055 : 1) * (phase === 'final' ? .74 : 1);
    const openY = phase === 'final' ? -.11 : (small ? .03 : -.018);
    const bob = reduced ? 0 : Math.sin(time * 1.55) * .07;
    book.current.scale.setScalar(THREE.MathUtils.damp(book.current.scale.x, scale, 7, delta));
    book.current.position.y = THREE.MathUtils.damp(book.current.position.y, frameHeight * THREE.MathUtils.lerp(-.071, openY, spread) + bob, 8, delta);
    const follow = reduced || small || phase !== 'intro' ? 0 : 1;
    book.current.rotation.set(
      THREE.MathUtils.damp(book.current.rotation.x, THREE.MathUtils.lerp(-.17, -.14, spread) - pointer.y * .16 * follow, 6, delta),
      THREE.MathUtils.damp(book.current.rotation.y, (-.34 + pointer.x * .23 * follow) * (1 - spread), 6, delta),
      THREE.MathUtils.damp(book.current.rotation.z, -.15 * (1 - spread), 6, delta),
    );
    origin.current.position.x = -width * .5 * (1 - spread);
    cover.current.rotation.y = (-Math.PI + .09) * spread;
    cover.current.position.z = THREE.MathUtils.lerp(.38, -.18, spread);
    if (leaf.current) {
      leaf.current.visible = phase !== 'opening' || animation.leaf > .04;
      leaf.current.rotation.y = phase === 'opening' ? (-Math.PI + .16) * (1 - animation.leaf) : 0;
    }
    pulse.current.intensity = 1.2 + animation.light * 15 + (phase === 'final' ? 3.5 : hovered ? 1.7 : 0);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, phase === 'final' ? 9.5 : 9 - zoom * .52, 5, delta);
  });

  const right = turn?.direction === 1 ? page + 1 : page;
  const left = turn?.direction === -1 ? page - 1 : page;
  const canRead = phase === 'reading' && !turn;
  return <group ref={book} scale={.9}>
    <group ref={origin}>
      <group position={[0, 0, -.24]}><Binding /></group>
      <RoundedBox args={[.18, height + .035, .35]} position={[-.025, 0, -.045]} radius={.055} smoothness={2}>
        <meshStandardMaterial color="#24334a" roughness={.61} />
      </RoundedBox>
      {[-1.18, -.99, .99, 1.18].map(y => <mesh key={y} position={[-.104, y, -.036]}>
        <boxGeometry args={[.048, .034, .294]} />
        <meshStandardMaterial color={gold} roughness={.47} metalness={.4} />
      </mesh>)}
      <BookPage side={1} texture={textures.right[right]} onSelect={canRead ? () => onTurn(1) : undefined} />
      <group ref={cover} position={[0, 0, .38]} onClick={phase === 'intro' ? (event) => { event.stopPropagation(); onOpen(); } : undefined}>
        <Binding face={textures.cover} />
      </group>
      {phase !== 'intro' && <group ref={leaf} visible={phase !== 'opening'}>
        <BookPage side={-1} texture={textures.left[left]} onSelect={canRead ? () => onTurn(-1) : undefined} />
      </group>}
      {turn && <TurningSheet key={turn.id} turn={turn} page={page} textures={textures} reduced={reduced} />}
      <pointLight ref={pulse} position={[0, -.24, 1.3]} color="#ffd18f" decay={2} distance={6} />
    </group>
  </group>;
}
