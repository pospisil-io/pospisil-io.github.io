const pospisil = {
    // BAF!!!
}
document.addEventListener('DOMContentLoaded', () => {
    let world, mass, body, ground, shape, timeStep = 1 / 60,
        camera, scene, renderer, geometry, material, mesh, plane, planeGeo, clock, control;
    let commandInput = [], commandVector = new CANNON.Vec3(0, 0, 0)

    const initCannon = () => {
        world = new CANNON.World();
        world.gravity.set(0, 0, -9.81);
        world.broadphase = new CANNON.NaiveBroadphase();
        world.solver.iterations = 10;

        // shape = new CANNON.Box(new CANNON.Vec3(.5, .5, .5));
        body = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(0, 0, .5),
            shape: new CANNON.Sphere(.5)
        });
        world.addBody(body);

        planeGeo = new CANNON.Plane()
        ground = new CANNON.Body()
        ground.addShape(planeGeo)
        world.addBody(ground)
    }

    const initThree = () => {
        THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1)
        scene = new THREE.Scene();
        scene.add(new THREE.AxesHelper(5))

        // material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
        // geometry = new THREE.BoxGeometry(1, 1, 1);
        mesh = new THREE.Mesh(
            new THREE.SphereGeometry(1, 32, 16),
            new THREE.MeshLambertMaterial({
                color: 0x00ff00,
                wireframe: true
            })
        )
        mesh.castShadow = true
        mesh.add(new THREE.AxesHelper(3))
        scene.add(mesh);

        camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, .1, 1000);
        // camera.up.set(0, 0, 1)
        // camera.position.set(0, -10, 5)
        // camera.position = mesh.position.add(new THREE.Vector3(0, -100, 50))
        camera.position.set(0, -10, 5)
        camera.lookAt(mesh.position);

        scene.add(camera);

        var planeGeometry = new THREE.PlaneGeometry(10, 10, 1, 1);
        var planeMaterial = new THREE.MeshLambertMaterial({ color: 0x777777, wireframe: true });
        var plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.receiveShadow = true;
        scene.add(plane)

        let ambientLight = new THREE.AmbientLight(0xaaaaaa)
        scene.add(ambientLight)

        renderer = new THREE.WebGLRenderer()
        renderer.setClearColor(new THREE.Color(0x000000));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap

        document.body.appendChild(renderer.domElement);

        window.addEventListener('resize', () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        })

        control = new pospisil.flexCamMouseControl({
            easing: TWEEN.Easing.Quadratic.Out
        }, renderer.domElement)

        const setCommandVector = () => {
            if (commandInput.length == 0) commandVector.set(0, 0, 0)
            let horizontal = 0, vertical = 0, rotation = 0
            if (commandInput.indexOf('KeyA') > -1) horizontal -= 1
            if (commandInput.indexOf('KeyD') > -1) horizontal += 1
            if (commandInput.indexOf('KeyW') > -1) vertical += 1
            if (commandInput.indexOf('KeyS') > -1) vertical -= 1
            if (commandInput.indexOf('KeyQ') > -1) rotation -= 1
            if (commandInput.indexOf('KeyE') > -1) rotation += 1
            commandVector.set(horizontal, vertical, rotation)
        }

        document.addEventListener('keydown', (ev) => {
            if (ev.repeat) return false
            commandInput = _.concat(commandInput, ev.code)
            setCommandVector()
            // console.log(commandInput);
        })
        document.addEventListener('keyup', (ev) => {
            _.remove(commandInput, i => i == ev.code)
            setCommandVector()
            // console.log(commandInput);
        })

        clock = new THREE.Clock()

        // renderer.domElement.style.cursor = 'crosshair'
    }

    const animate = () => {
        // control.update(clock.getDelta())
        requestAnimationFrame(animate)
        updatePhysics()
        render()
    }

    const updatePhysics = () => {
        // Step the physics world
        world.step(timeStep);
        // horizontal movement ### learn matrix operations !!!
        body.applyLocalForce(new CANNON.Vec3(commandVector.x, 0, 0), new CANNON.Vec3(0, 0, 1))
        // Copy coordinates from Cannon.js to Three.js
        mesh.position.copy(body.position);
        mesh.quaternion.copy(body.quaternion);
    }

    const render = () => {
        // camera.position = mesh.position.add(new THREE.Vector3(0, -10, 5))
        camera.lookAt(mesh.position)
        camera.position.copy(body.position.vadd(new CANNON.Vec3(0, -10, 5)))
        camera.rotateY(-control.cameraAngleDelta.x * control.scale)
        camera.rotateX(control.cameraAngleDelta.y * control.scale + .1) // look a little bit higher than the body position
        TWEEN.update()
        renderer.render(scene, camera)
    }

    initCannon()
    initThree()
    animate()
})