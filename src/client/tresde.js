import * as THREE from 'three';

export function initThreeScene() {
    //CANVAS
    const canvas = document.querySelector('.webgl');
    if (!canvas || canvas.sceneInitialized) return;
    canvas.sceneInitialized = true;
    //TAMAÑOS
    const tamaños = {
        width: canvas.clientWidth,
        height: canvas.clientHeight,
    };
    //CURSOR
    const cursor = { x: 0, y: 0 };
    window.addEventListener('mousemove', (event) => {
        cursor.x = (event.clientX / tamaños.width) * 2 - 1;
        cursor.y = -(event.clientY / tamaños.height) * 2 + 1;
    });
    //ESCENA
    const escena = new THREE.Scene();
    //LUCES
    const pointLight = new THREE.PointLight(0xffffff, 100);
    pointLight.position.set(0, 0, 15);
    
    escena.add(pointLight);
    
    //GEOMETRIA
    const ancho = 16;
    const alto = 9;
    const segmentos = 10;
    const geometriaPlano = new THREE.PlaneGeometry(ancho, alto, segmentos*ancho, segmentos*alto);

     // Crear video element
    const video = document.createElement('video');
    video.src = '/images/video.webm'; // Cambia esto por tu archivo
    video.loop = true;
    video.muted = true;
    video.playsInline = true; // para móviles
    video.autoplay = true;

    // Necesario para algunos navegadores (por ejemplo en eventos de usuario)
    video.addEventListener('canplay', () => {
      video.play();
    });

    // Crear textura de video
    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBFormat;

    const materialPlano = new THREE.MeshPhongMaterial({ 
        map: videoTexture,
        side: THREE.DoubleSide,
        shininess: 10, // brillo especular
        specular: 0x222222 // color del brillo
        }); // Fin material
    const plano = new THREE.Mesh(geometriaPlano, materialPlano);
    escena.add(plano);

    const camara = new THREE.PerspectiveCamera(75, tamaños.width / tamaños.height);
    camara.position.z = 10;
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

    // Anim RayCasting
    const raycaster = new THREE.Raycaster();
    const posAttr = geometriaPlano.attributes.position;
    const zOriginal = Float32Array.from(posAttr.array); // Guardar copia original de z

    const deformacionMax = 10;
    const reloj = new THREE.Clock();
    const tick = () => {
    const tiempo = reloj.getElapsedTime();
    const radioBase = 1;
    const radioVariable = radioBase + Math.sin(tiempo * 2) * 0.5;
    
    raycaster.setFromCamera(cursor, camara);
    const intersecciones = raycaster.intersectObject(plano);
    

    if (intersecciones.length > 0) {
        const punto = intersecciones[0].point;

        for (let i = 0; i < posAttr.count; i++) {
            const ix = posAttr.getX(i);
            const iy = posAttr.getY(i);
            const izOriginal = zOriginal[i * 3 + 2];

            const dx = ix - punto.x;
            const dy = iy - punto.y;

            // Aquí puedes meter distorsión (como vimos antes)
            const ruido = Math.sin(ix * 3 + tiempo) * Math.cos(iy * 3 - tiempo);
            const distancia = Math.sqrt(dx * dx + dy * dy) * (1 + 0.3 * ruido);

            const influencia = Math.exp(-(distancia ** 2) / (radioVariable ** 2));
            const wave = Math.sin(distancia * 10 + tiempo * 3) + Math.cos(distancia * 15 - tiempo * 2);
            const deformacion = -influencia * Math.abs(wave) * deformacionMax;

            const zActual = posAttr.getZ(i);
            const nuevoZ = THREE.MathUtils.lerp(zActual, izOriginal + deformacion, 0.2);
            posAttr.setZ(i, nuevoZ);
        }
    } else {
        // Relajación: volver a la posición original
        for (let i = 0; i < posAttr.count; i++) {
            const zActual = posAttr.getZ(i);
            const izOriginal = zOriginal[i * 3 + 2];
            const nuevoZ = THREE.MathUtils.lerp(zActual, izOriginal, 0.1); // más lento para suavidad
            posAttr.setZ(i, nuevoZ);
        }
    }

    posAttr.needsUpdate = true;
    renderizador.render(escena, camara);
    window.requestAnimationFrame(tick);
};


    tick();
}

