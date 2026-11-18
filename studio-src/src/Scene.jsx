import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer } from '@react-three/drei'
import PlayerController from './PlayerController'
import { Architecture, CinemaZone, LibraryZone, SalesZone, HallZone } from './Zones'
import { SPAWN } from './world'
import { rt } from './store'

function Floor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -2]}>
        <planeGeometry args={[44, 40]} />
        <meshStandardMaterial color="#0c0e14" roughness={0.32} metalness={0.35} envMapIntensity={0.8} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4.2, -2]}>
        <planeGeometry args={[44, 40]} />
        <meshStandardMaterial color="#090a0f" roughness={1} />
      </mesh>
    </group>
  )
}

export default function Scene() {
  return (
    <Canvas
      dpr={rt.touch ? [1, 1.25] : [1, 1.75]}
      camera={{ fov: 72, near: 0.1, far: 80, position: [SPAWN.x, 1.7, SPAWN.z] }}
      gl={{ antialias: !rt.touch, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#07080c']} />
      <fog attach="fog" args={['#07080c', 18, 55]} />
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#bfc6ff', '#15110e', 0.5]} />
      {/* лёгкое «студийное» окружение без загрузки внешних HDR */}
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 5, 0]} scale={[14, 14, 1]} rotation-x={Math.PI / 2} color="#e8ecff" />
        <Lightformer form="rect" intensity={1.2} position={[-8, 3, 0]} scale={[10, 3, 1]} rotation-y={Math.PI / 2} color="#f5d77a" />
        <Lightformer form="rect" intensity={1.2} position={[8, 3, 0]} scale={[10, 3, 1]} rotation-y={-Math.PI / 2} color="#7276e1" />
      </Environment>
      <Floor />
      <Architecture />
      <HallZone />
      <CinemaZone />
      <LibraryZone />
      <SalesZone />
      <ContactShadows position={[0, 0.01, 0]} opacity={0.55} scale={50} blur={2.4} far={3} resolution={512} frames={1} />
      <PlayerController />
    </Canvas>
  )
}
