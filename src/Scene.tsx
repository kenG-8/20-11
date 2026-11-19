import { Component, useLayoutEffect, type ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { VoxelBook } from './VoxelBook';
import { InteractiveObjects, Library, ParticleSystem } from './Scenery';
import type { Burst, Keepsake, Phase, Turn } from './data';

type SceneProps = {
  phase: Phase; page: number; turn: Turn | null; burst: Burst | null; active?: Keepsake; found: Set<string>;
  hovered: boolean; reduced: boolean; onOpen: () => void; onTurn: (direction: -1 | 1) => void;
  onSelect: (item: Keepsake) => void; onOpeningFlash: () => void; onReady: () => void; onFail: () => void;
};

export function supportsWebGL() {
  try {
    const context = document.createElement('canvas').getContext('webgl2');
    if (!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

class SceneBoundary extends Component<{ children: ReactNode; onFail: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFail(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function StageContents(props: SceneProps) {
  const { gl } = useThree();
  useLayoutEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('webglcontextlost', props.onFail);
    props.onReady();
    return () => canvas.removeEventListener('webglcontextlost', props.onFail);
  }, [gl, props.onFail, props.onReady]);
  return <>
    <fog attach="fog" args={['#10172b', 10, 23]} />
    <Library />
    <VoxelBook {...props} />
    <InteractiveObjects {...props} />
    <ParticleSystem {...props} />
  </>;
}

export default function Scene(props: SceneProps) {
  const touchScreen = window.matchMedia('(pointer: coarse)').matches;
  return <SceneBoundary onFail={props.onFail}><Canvas shadows
    className="three-stage"
    camera={{ position: [0, 0, 9], fov: 42, near: .1, far: 45 }}
    dpr={[1, touchScreen ? 1.25 : 1.65]}
    gl={{ antialias: true, alpha: true, powerPreference: 'default', toneMapping: THREE.ACESFilmicToneMapping }}
    onCreated={({ gl }) => {
      gl.setClearColor('#10172b', 1);
      gl.toneMappingExposure = 1.12;
    }}
  ><StageContents {...props} /></Canvas></SceneBoundary>;
}
