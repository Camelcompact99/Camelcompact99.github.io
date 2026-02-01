
import { Suspense, useRef, useEffect, useMemo, useState } from 'react'
import { Canvas, useLoader, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { TextureLoader } from 'three'

function ImagePlane({ textureUrl, depthUrl, onLoad, isMobile }) {
    const [texture, depth] = useLoader(TextureLoader, [textureUrl, depthUrl])
    const meshRef = useRef(null)
    const scrollRotationRef = useRef(0)

    useEffect(() => {
        onLoad?.()
    }, [onLoad])

    useEffect(() => {

        if (!isMobile) return

        const handleScroll = (e) => {
            // Horizontal scroll for mobile rotation
            scrollRotationRef.current += e.deltaX * 0.002
        }

        window.addEventListener('wheel', handleScroll, { passive: true })

        // Touch scroll handling
        let touchStartX = 0
        const handleTouchStart = (e) => {
            touchStartX = e.touches[0].clientX
        }

        const handleTouchMove = (e) => {
            if (touchStartX) {
                const touchDelta = e.touches[0].clientX - touchStartX
                scrollRotationRef.current += touchDelta * 0.002
                touchStartX = e.touches[0].clientX
            }
        }

        window.addEventListener('touchstart', handleTouchStart, { passive: true })
        window.addEventListener('touchmove', handleTouchMove, { passive: true })

        return () => {
            window.removeEventListener('wheel', handleScroll)
            window.removeEventListener('touchstart', handleTouchStart)
            window.removeEventListener('touchmove', handleTouchMove)
        }
    }, [isMobile])

    // Create a memoized geometry to avoid recreation on every render
    const geometry = useMemo(() => new THREE.PlaneGeometry(3, 3, 360, 360), [])

    useFrame((state) => {
        if (!meshRef.current) return

        if (isMobile) {
            // Mobile: Use scroll-based rotation
            meshRef.current.rotation.y = scrollRotationRef.current

            // Periodic displacement animation for mobile
            const time = state.clock.elapsedTime
            const periodicDisplacement = Math.sin(time * 0.5) * 0.2 + 0.2 // Oscillates between 0 and 1

            // Safety check for material
            if (meshRef.current.material) {
                meshRef.current.material.displacementScale = periodicDisplacement * 1.5
            }
        } else {
            // Desktop: Use pointer-based rotation
            meshRef.current.rotation.y = state.pointer.x * 0.2
            meshRef.current.rotation.x = -state.pointer.y * 0.2

            // Displacement logic for desktop
            const maxDisplacement = 3
            const combinedDisplacement = (Math.abs(state.pointer.x) + Math.abs(state.pointer.y)) / 2

            // Safety check for material
            if (meshRef.current.material) {
                meshRef.current.material.displacementScale = combinedDisplacement * maxDisplacement
            }
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

function MovingLight({ isMobile }) {
    const lightRef = useRef(null)

    useFrame((state) => {
        if (lightRef.current && !isMobile) {
            lightRef.current.position.x = state.pointer.x * 2
            lightRef.current.position.y = state.pointer.y * 2
        }
    })

    return <directionalLight ref={lightRef} position={[0, 0, 1]} intensity={3} />
}

export default function InteractiveLogo({ images = [] }) {
    const [selectedImage, setSelectedImage] = useState(null);
    const [cargado, setCargado] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detect if device is mobile
    useEffect(() => {
        const checkMobile = () => {
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isSmallScreen = window.innerWidth <= 768;
            setIsMobile(isTouchDevice && isSmallScreen);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (images.length > 0) {
            const randomImg = images[Math.floor(Math.random() * images.length)];
            setSelectedImage(randomImg);
        }
    }, [images]);

    if (!selectedImage) return null;

    return (
        <div style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            // Enable horizontal scrolling on mobile for rotation
            overflowX: isMobile ? 'auto' : 'hidden',
            touchAction: isMobile ? 'pan-x' : 'auto'
        }}>
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
                <MovingLight isMobile={isMobile} />
                <Suspense fallback={null}>
                    <ImagePlane
                        textureUrl={selectedImage.texture}
                        depthUrl={selectedImage.depth}
                        onLoad={() => setCargado(true)}
                        isMobile={isMobile}
                    />
                </Suspense>
            </Canvas>
        </div>
    )
}
