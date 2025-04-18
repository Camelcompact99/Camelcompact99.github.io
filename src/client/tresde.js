// src/tresde.js
    import * as THREE from 'three';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


  export function initThreeScene() {
    let mixer, caerse, idleAction, raycaster = new THREE.Raycaster();
    let caerseruns; 
    let modelo;  
    let huesoCabeza;

    // Canvas
    const canvas = document.querySelector('.webgl');

    // Verificar si la escena ya ha sido inicializada para evitar errores
    if (!canvas || canvas.sceneInitialized) return;
    canvas.sceneInitialized = true;

    // Tamaños
    const tamaños = {
        width: canvas.clientWidth,
        height:canvas.clientHeight,
    };

    // Cursor
    const cursor = { x: 0, y: 0 };
    window.addEventListener('mousemove', (event) => {
        cursor.x = (event.clientX / tamaños.width) * 2 - 1;
        cursor.y = -(event.clientY / tamaños.height) * 2 + 1;
    });

    // Escena
    const escena = new THREE.Scene();

    // Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    escena.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 30);
    pointLight.position.set(2, 3, 4);
    escena.add(pointLight);

    // Imagen de carga
    const loadingImage = document.createElement('img');
    loadingImage.src = '/images/preload.webp'; // Cambia esto por la ruta de tu imagen
    loadingImage.style.position = 'absolute';
    loadingImage.style.top = '50%';
    loadingImage.style.left = '50%';
    loadingImage.style.transform = 'translate(-50%, -50%)';
    loadingImage.style.width = '300px';
    loadingImage.style.filter = 'blur(90px)'; // Comienza con un gran desenfoque
    loadingImage.style.transition = 'filter 0.1s ease-out'; // Suaviza la transición del desenfoque
    document.body.appendChild(loadingImage);

    // GLTFLoader
    const loader = new GLTFLoader();
    loader.load(
        '/models/homerr.glb', // Ruta a tu modelo GLB
        (gltf) => {
            modelo = gltf.scene;
            escena.add(modelo);

            huesoCabeza = modelo.children[0].children[2].children[0].children[0].children[0].children[0].children[0];
            
            mixer = new THREE.AnimationMixer(modelo);
            const caer = gltf.animations[1];
            caerse = mixer.clipAction(caer);
            caerse.setLoop(THREE.LoopOnce);  
            caerse.time = 1;
            
            caerseruns = caerse.isRunning();

            const idle = gltf.animations[2];   
            idleAction = mixer.clipAction(idle);
            idleAction.setLoop(THREE.LoopRepeat);
            idleAction.play();

            window.addEventListener('click', onClick, false);

            // Ocultar la imagen de carga al completar la carga
            loadingImage.style.opacity = '0'; // Suaviza la transición al ocultar
            setTimeout(() => {
                document.body.removeChild(loadingImage);
            }, 500); // Espera a que termine la transición
        },
        function (xhr) {
            // Ajustar el desenfoque de la imagen según el progreso de carga
            const progress = xhr.loaded / xhr.total;
            loadingImage.style.filter = `blur(${20 - progress * 20}px)`; // Reduce el desenfoque
        },
        function (error) {
            console.error('An error happened', error);
        }
    );

    function onClick(event) {
       

        if (!modelo) {
            console.error("El modelo aún no ha sido cargado.");
            return;
        }

        cursor.x = (event.clientX / window.innerWidth) * 2 - 1;
        cursor.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(cursor, camara);

        const intersects = raycaster.intersectObject(modelo, true);

        if (intersects.length > 0) {
            caerse.reset();
            caerse.play();
        }
    }


    const camara = new THREE.PerspectiveCamera(75, tamaños.width / tamaños.height);
    camara.position.set(-3.8, 2.5, 0.56);
    camara.rotation.set(-1.5, -1.2,-1.5);
    escena.add(camara);

    const renderizador = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });
    renderizador.setSize(tamaños.width, tamaños.height);
    renderizador.setPixelRatio(window.devicePixelRatio);

    window.addEventListener('resize', () => {
        tamaños.width = window.innerWidth;
        tamaños.height = window.innerHeight;

        camara.aspect = tamaños.width / tamaños.height;
        camara.updateProjectionMatrix();

        renderizador.setSize(tamaños.width, tamaños.height);
    });

    const reloj = new THREE.Clock();
    const tick = () => {
        const delta = reloj.getDelta();
        if (mixer) mixer.update(delta);
        if (huesoCabeza) {
            const maxRotationY = Math.PI / 3; // Limitar a ±30 grados
            const maxRotationX = Math.PI / 5; // Limitar a ±30 grados
            huesoCabeza.rotation.y = cursor.x * maxRotationY;
            huesoCabeza.rotation.x = cursor.y * maxRotationX*-1;
        }

        renderizador.render(escena, camara);

        window.requestAnimationFrame(tick);
    };

    tick();
}
