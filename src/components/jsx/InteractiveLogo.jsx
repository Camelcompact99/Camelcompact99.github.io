
import { Suspense, useRef, useEffect, useMemo, useState } from 'react'
import { Canvas, useLoader, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { TextureLoader } from 'three'

function ImagePlane({ textureUrl, depthUrl, onLoad }) {
    const [texture, depth] = useLoader(TextureLoader, [textureUrl, depthUrl])
    const meshRef = useRef(null)

    useEffect(() => {
        onLoad?.()
    }, [onLoad])

    // Create a memoized geometry to avoid recreation on every render
    const geometry = useMemo(() => new THREE.PlaneGeometry(3, 3, 360, 360), [])

    useFrame((state) => {
        if (!meshRef.current) return

        // Rotation based on pointer position
        // Make it subtler than the original code if needed, or keep it as is
        meshRef.current.rotation.y = state.pointer.x * 0.2
        meshRef.current.rotation.x = -state.pointer.y * 0.2

        // Displacement logic
        const maxDisplacement = 3
        const combinedDisplacement = (Math.abs(state.pointer.x) + Math.abs(state.pointer.y)) / 2

        // Safety check for material
        if (meshRef.current.material) {
            meshRef.current.material.displacementScale = combinedDisplacement * maxDisplacement
        }
    })

    return (
        <mesh ref={meshRef} geometry={geometry}>
            <meshStandardMaterial
                map={texture}
                displacementMap={depth}
                displacementScale={0}
                transparent={true}
            />
        </mesh>
    )
}

function MovingLight() {
    const lightRef = useRef(null)

    useFrame((state) => {
        if (lightRef.current) {
            lightRef.current.position.x = state.pointer.x * 2
            lightRef.current.position.y = state.pointer.y * 2
        }
    })

    return <directionalLight ref={lightRef} position={[0, 0, 1]} intensity={3} />
}

export default function InteractiveLogo({ images = [] }) {
    const [selectedImage, setSelectedImage] = useState(null);
    const [cargado, setCargado] = useState(false);

    useEffect(() => {
        if (images.length > 0) {
            const randomImg = images[Math.floor(Math.random() * images.length)];
            setSelectedImage(randomImg);
        }
    }, [images]);

    if (!selectedImage) return null;

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* Preload blurred overlay */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${selectedImage.thumbnail})`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    filter: 'blur(20px)',
                    opacity: cargado ? 0 : 1,
                    transition: 'opacity 2.5s ease-out',
                    pointerEvents: 'none',
                    zIndex: 1,
                }}
            />

            <Canvas camera={{ position: [0, 0, 0.5], fov: -200 }}>
                <ambientLight intensity={0.5} />
                <MovingLight />
                <Suspense fallback={null}>
                    <ImagePlane
                        textureUrl={selectedImage.texture}
                        depthUrl={selectedImage.depth}
                        onLoad={() => setCargado(true)}
                    />
                </Suspense>
            </Canvas>
        </div>
    )
}
