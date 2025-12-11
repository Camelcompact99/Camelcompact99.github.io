import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import preloaderImage from '../../images/preload_logo_Alejandro_Vazquez.webp';

const Logo3D = ({ images = [], matcapUrl = '/models/matcap.png' }) => {
    const mountRef = useRef(null);
    const [floatingImages, setFloatingImages] = React.useState([]);
    const lastSpawnTime = useRef(0);
    const modelRef = useRef(null);
    const boxSizeRef = useRef(null);
    const [loadingProgress, setLoadingProgress] = React.useState(0);
    const [isLoaded, setIsLoaded] = React.useState(false);

    // Control variables for mouse sensitivity
    const MOUSE_SENSITIVITY_X = -0.2;
    const MOUSE_SENSITIVITY_Y = -0.2;

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        // Scene setup
        const scene = new THREE.Scene();

        // Camera setup
        const width = mount.clientWidth;
        const height = mount.clientHeight;
        const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
        camera.position.z = 2; // Initial position

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        mount.appendChild(renderer.domElement);

        // Raycaster
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        // Helper function to update camera Z based on model size and aspect ratio
        const updateCameraPosition = () => {
            if (!modelRef.current || !boxSizeRef.current) return;

            const boxSize = boxSizeRef.current;
            const aspect = mount.clientWidth / mount.clientHeight;
            const fov = camera.fov * (Math.PI / 180);

            // Calculate distance required to fit the model height
            const distanceVertical = (boxSize.y / 2) / Math.tan(fov / 2);

            // Calculate distance required to fit the model width
            // field of view horizontal = 2 * atan( tan(fov/2) * aspect )
            const distanceHorizontal = (boxSize.x / 2) / (Math.tan(fov / 2) * aspect);

            // Choose the greater distance to ensure the model stays within view
            const distance = Math.max(distanceVertical, distanceHorizontal);

            // Add a margin factor (e.g. 1.2 for 20% padding)
            camera.position.z = distance * 1.5;
        };

        // Load Model
        const loader = new GLTFLoader();
        const textureLoader = new THREE.TextureLoader();
        const matcapTexture = textureLoader.load(matcapUrl);

        let invisibleCollider; // Caja invisible para el raycast

        loader.load(
            '/models/miname.glb',
            (gltf) => {
                const model = gltf.scene;
                modelRef.current = model;

                // Apply MatCap material
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.material = new THREE.MeshMatcapMaterial({
                            matcap: matcapTexture
                        });
                    }
                });

                // Center the model
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                boxSizeRef.current = size; // Store size for resize logic

                model.position.sub(center); // Center at 0,0,0
                scene.add(model);
                // Initial rotation
                model.rotation.x = Math.PI / 2;

                // Crear caja invisible (collider) con el tamaño del modelo
                const colliderGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
                const colliderMaterial = new THREE.MeshBasicMaterial({
                    visible: false // Invisible
                });
                invisibleCollider = new THREE.Mesh(colliderGeometry, colliderMaterial);
                invisibleCollider.position.copy(model.position);
                scene.add(invisibleCollider);

                // Initial camera adjustment
                updateCameraPosition();

                // Set loading complete
                setLoadingProgress(100);
                setTimeout(() => setIsLoaded(true), 500); // Small delay for smooth transition

                // Dispatch event to notify that the 3D logo has loaded
                window.dispatchEvent(new CustomEvent('logo-3d-loaded'));
            },
            (xhr) => {
                // Progress callback
                if (xhr.lengthComputable) {
                    const percentComplete = (xhr.loaded / xhr.total) * 100;
                    setLoadingProgress(percentComplete);
                } else {
                    // Fallback if total size is unknown, just increment slowly to 99
                    setLoadingProgress(prev => Math.min(prev + 10, 99));
                }
            },
            (error) => {
                console.error('An error occurred loading the model:', error);
            }
        );

        // Mouse interaction state
        let mouseX = 0;
        let mouseY = 0;
        let prevMouseX = 0;
        let prevMouseY = 0;
        let mouseVelocityX = 0;
        let mouseVelocityY = 0;

        const handleMouseMove = (event) => {
            const rect = mount.getBoundingClientRect();

            // Normalize mouse position from -1 to 1 for Three.js (relative to canvas)
            const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            mouse.set(x, y);

            // Calculate mouse velocity for image drift
            mouseVelocityX = x - prevMouseX;
            mouseVelocityY = y - prevMouseY;
            prevMouseX = x;
            prevMouseY = y;

            // Global mouse for rotation (relative to canvas bounds for better responsiveness)
            mouseX = x;
            mouseY = y;

            // Raycasting for images
            if (invisibleCollider && images.length > 0) {
                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObject(invisibleCollider, false);

                if (intersects.length > 0) {
                    const now = Date.now();
                    if (now - lastSpawnTime.current > 190) { // Cooldown 500ms para que las imágenes no salgan tan seguido
                        lastSpawnTime.current = now;

                        const randomImage = images[Math.floor(Math.random() * images.length)];
                        const randomY = (Math.random() - 0.5) * 400; // Random Y translation
                        const randomDuration = 1.5 + Math.random() * 1; // Random duration between 2-3s

                        // Apply mouse velocity for drift effect (scaled for visual effect)
                        const driftX = mouseVelocityX * 150;
                        const driftY = mouseVelocityY * 150;

                        const newImage = {
                            id: now,
                            src: randomImage,
                            x: event.clientX - rect.left,
                            y: event.clientY - rect.top,
                            translateY: randomY,
                            driftX: driftX,
                            driftY: driftY,
                            duration: randomDuration
                        };

                        setFloatingImages(prev => [...prev, newImage]);

                        // Remove image after animation
                        setTimeout(() => {
                            setFloatingImages(prev => prev.filter(img => img.id !== now));
                        }, 2000);
                    }
                }
            }
        };

        // Attach listener to mount instead of window
        mount.addEventListener('mousemove', handleMouseMove);

        // Animation Loop
        let animationId;
        const animate = () => {
            animationId = requestAnimationFrame(animate);

            if (modelRef.current) {
                const model = modelRef.current;
                // Calculate target rotation based on mouse position
                // Base rotation + mouse influence
                const targetX = (Math.PI / 2) + (mouseY * MOUSE_SENSITIVITY_Y);
                const targetY = mouseX * MOUSE_SENSITIVITY_X;

                // Smoothly interpolate current rotation to target rotation
                model.rotation.x += (targetX - model.rotation.x) * 0.05;
                model.rotation.z += (targetY - model.rotation.z) * 0.05;
            }

            renderer.render(scene, camera);
        };
        animate();

        // Handle Resize
        const handleResize = () => {
            if (!mount) return;
            const newWidth = mount.clientWidth;
            const newHeight = mount.clientHeight;

            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);

            updateCameraPosition();
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            mount.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
            if (mount && renderer.domElement) {
                mount.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [images]);

    return (
        <div ref={mountRef} style={{ width: '100%', height: '70%', position: 'relative', overflow: 'hidden' }}>
            {/* Preloader Overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                opacity: isLoaded ? 0 : 1,
                transition: 'opacity 0.5s ease-out',
                pointerEvents: 'none',
                zIndex: 10
            }}>
                <img
                    src={preloaderImage.src}
                    alt="Loading..."
                    style={{
                        width: 'auto',
                        height: '60%', // Adjust as needed
                        objectFit: 'contain',
                        filter: `blur(${Math.max(10, 50 - (loadingProgress / 5))}px)`,
                        transition: 'filter 0.2s ease-out'
                    }}
                />
            </div>

            {floatingImages.map(img => (
                <img
                    key={img.id}
                    src={img.src}
                    style={{
                        position: 'absolute',
                        zIndex: Math.random() > 0.5 ? 1 : -1,
                        left: img.x,
                        top: img.y,
                        width: '150px',
                        height: 'auto',
                        pointerEvents: 'none',
                        transform: 'translate(-50%, -50%)',
                        animation: `float-fade ${img.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
                        '--translate-y': `${img.translateY}px`,
                        '--drift-x': `${img.driftX}px`,
                        '--drift-y': `${img.driftY}px`,
                        willChange: 'opacity, transform'
                    }}
                />
            ))}
            <style>{`
                @keyframes float-fade {
                    0% {
                        opacity: 0;
                        transform: translate(-50%, -50%) translateY(0) translateX(0) scale(0.3);
                    }
                    20% {
                        opacity: 1;
                        transform: translate(-50%, -50%) 
                                   translateY(calc(var(--drift-y) * 0.3)) 
                                   translateX(calc(var(--drift-x) * 0.3)) 
                                   scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translate(-50%, -50%) 
                                   translateY(calc(var(--translate-y) + var(--drift-y))) 
                                   translateX(var(--drift-x)) 
                                   scale(0.9);
                    }
                }
            `}</style>
        </div>
    );
};

export default Logo3D;
