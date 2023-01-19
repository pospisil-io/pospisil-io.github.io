document.addEventListener('DOMContentLoaded', () => {
    let camera, scene, renderer,
        raycaster, pointer, INTERSECTED, platforms = [],
        sun, viewTarget = new THREE.Vector3(0, 0, 0),
        clock, control

    const initThree = () => {
        THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1)

        let horizontalCount = Math.ceil(window.innerWidth / 100) + 2
        let verticalCount = Math.ceil(window.innerHeight / window.innerWidth * horizontalCount)
        let padding = .05

        scene = new THREE.Scene();

        const fog = new THREE.Fog(0x000000)
        fog.far = 38
        scene.fog = fog

        camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, .1, 10000)
        scene.add(camera)

        const placeLight = (color, position) => {
            let light = new THREE.PointLight(color)
            light.position.copy(position)
            light.castShadow = true
            light.shadow.mapSize.width = 512
            light.shadow.mapSize.height = 512
            light.shadow.camera.near = 0.1
            light.shadow.camera.far = 100
            light.radius = 2
            scene.add(light)
            return light
        }
        // const lightCursor = placeLight(0x222222, new THREE.Vector3(0, 0, 5))
        const lightRed = placeLight(0xff0000, new THREE.Vector3(-10, 8, 5))
        const lightGreen = placeLight(0x00ff00, new THREE.Vector3(10, 8, 5))
        const lightBlue = placeLight(0x0000ff, new THREE.Vector3(0, -8, 5))
        const lightLowAngle = placeLight(0xffffff, new THREE.Vector3(-10, 20, 1))
        sun = new THREE.DirectionalLight(0xffffff)
        scene.add(sun)

        raycaster = new THREE.Raycaster()
        pointer = new THREE.Vector2()

        const generateTexture = (text) => {
            const canvas = document.createElement('canvas')
            canvas.width = 128
            canvas.height = 128
            const ctx = canvas.getContext('2d')
            ctx.fillStyle = 'white'
            ctx.fillRect(0, 0, 128, 128)
            ctx.font = '48px arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillStyle = 'black'
            ctx.fillText(text, 64, 64)
            return new THREE.CanvasTexture(canvas)
        }

        const keyMap = [
            {
                x: -5, y: 1, character: 'q', action: () => {
                    moveCamera(
                        new THREE.Vector3(-horizontalCount * 1 / 2, verticalCount / 3, 3),
                        new THREE.Vector3(-5, 2, 0),
                    )
                }
            },
            { x: -4, y: 1, character: 'w', action: () => {
                moveCamera(
                    new THREE.Vector3(0, -2, 17),
                    new THREE.Vector3(0, -.1, 0),
                )
            } },
            { x: -3, y: 1, character: 'e', action: () => {
                moveCamera(
                    new THREE.Vector3(horizontalCount * 1 / 2, verticalCount / 3, 3),
                    new THREE.Vector3(5, -2, 0),
                )
            } },
            { x: -2, y: 1, character: 'r', action: () => {
                toggleLight(lightRed)
            } },
            { x: -1, y: 1, character: 't' },
            { x: 0, y: 1, character: 'y' },
            { x: 1, y: 1, character: 'u' },
            { x: 2, y: 1, character: 'i' },
            { x: 3, y: 1, character: 'o' },
            { x: 4, y: 1, character: 'p' },
            { x: -5, y: 0, character: 'a', action: () => {
                moveCamera(
                    new THREE.Vector3(-horizontalCount * 1 / 2, -verticalCount / 3, 3),
                    new THREE.Vector3(-5, -2, 0),
                )
            } },
            { x: -4, y: 0, character: 's', action: () => {
                moveCamera(
                    new THREE.Vector3(0, -verticalCount * 2 / 3, 3),
                    new THREE.Vector3(0, -3, 0),
                )
            } },
            { x: -3, y: 0, character: 'd', action: () => {
                moveCamera(
                    new THREE.Vector3(horizontalCount * 1 / 2, -verticalCount / 3, 3),
                    new THREE.Vector3(5, -2, 0),
                )
            } },
            { x: -2, y: 0, character: 'f' },
            { x: -1, y: 0, character: 'g', action: () => {
                toggleLight(lightGreen)
            } },
            { x: 0, y: 0, character: 'h', action: () => {
                toggleLight(sun)
            } },
            { x: 1, y: 0, character: 'j' },
            { x: 2, y: 0, character: 'k' },
            { x: 3, y: 0, character: 'l' },
            { x: -4, y: -1, character: 'z' },
            { x: -3, y: -1, character: 'x' },
            { x: -2, y: -1, character: 'c' },
            { x: -1, y: -1, character: 'v' },
            { x: 0, y: -1, character: 'b', action: () => {
                toggleLight(lightBlue)
            } },
            { x: 1, y: -1, character: 'n' },
            { x: 2, y: -1, character: 'm' }
        ]

        const buttonGeometry = new THREE.BoxGeometry(1, 1, .2)
        for (let v = 0; v < verticalCount; v++) {
            for (let h = 0; h < horizontalCount; h++) {
                let buttonBackgroundColor = new THREE.Color(0xffffff)
                const buttonFaceMaterial = new THREE.MeshPhongMaterial({
                    color: buttonBackgroundColor,
                    roughness: 0,
                    metalness: 0
                })
                const buttonFacesMaterials = [
                    new THREE.MeshPhongMaterial({ color: buttonBackgroundColor }), //right side
                    new THREE.MeshPhongMaterial({ color: buttonBackgroundColor }), //left side
                    new THREE.MeshPhongMaterial({ color: buttonBackgroundColor }), //top side
                    new THREE.MeshBasicMaterial({ color: buttonBackgroundColor }), //bottom side
                    buttonFaceMaterial, //front side
                    new THREE.MeshPhongMaterial({ color: buttonBackgroundColor }) //back side
                ]
                const buttonMesh = new THREE.Mesh(buttonGeometry, buttonFacesMaterials)
                buttonMesh.position.x = - Math.floor(horizontalCount / 2) * (1 + padding) + (horizontalCount % 2 == 0 ? .5 * (1 + padding) : 0) + h * (1 + padding)
                buttonMesh.position.y = - Math.floor(verticalCount / 2) * (1 + padding) + (verticalCount % 2 == 0 ? .5 * (1 + padding) : 0) + v * (1 + padding)
                const key = _.find(keyMap, {
                    'x': Math.floor(buttonMesh.position.x),
                    'y': Math.floor(buttonMesh.position.y)
                })
                if (key !== undefined) {
                    buttonFaceMaterial.map = generateTexture(key.character)
                    key.mesh = buttonMesh
                }
                buttonMesh.castShadow = true;
                buttonMesh.receiveShadow = true;
                buttonMesh.onPointerIn = (obj, scene) => {
                    if (obj.tweenRunning) obj.tween.stop()
                    obj.tween = new TWEEN.Tween(obj.rotation).easing(TWEEN.Easing.Quadratic.InOut).to({
                        x: buttonMesh.position.y / 20,
                        y: -buttonMesh.position.x / 20,
                        z: 0
                    }, 250).onStart(() => {
                        obj.tweenRunning = true
                    }).onComplete(() => {
                        obj.tweenRunning = false
                    }).start()
                }
                buttonMesh.onPointerOut = (obj, scene) => {
                    obj.tween = new TWEEN.Tween(obj.rotation).easing(TWEEN.Easing.Quadratic.InOut).to({
                        x: 0,
                        y: 0,
                        z: 0
                    }, 1000).onStart(() => {
                        obj.tweenRunning = true
                    }).onComplete(() => {
                        obj.tweenRunning = false
                    }).delay(500).start()
                }
                buttonMesh.v = v
                buttonMesh.h = h
                scene.add(buttonMesh)
                platforms.push(buttonMesh)
            }
        }

        renderer = new THREE.WebGLRenderer({
            antialias: true
        })
        renderer.setClearColor(new THREE.Color(0x000000));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap

        document.body.appendChild(renderer.domElement);

        window.addEventListener('resize', () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix()
        })
        document.addEventListener('pointermove', (ev) => {
            pointer.x = (ev.clientX / window.innerWidth) * 2 - 1
            pointer.y = - (ev.clientY / window.innerHeight) * 2 + 1
            // lightCursor.position.set(pointer.x * horizontalCount, pointer.y * verticalCount, 5)
            // console.log(pointer);
        })

        const moveCamera = (to, lookAt) => {
            new TWEEN.Tween(camera.position).easing(TWEEN.Easing.Quadratic.InOut).to({
                x: to.x,
                y: to.y,
                z: to.z
            }, 400).onUpdate(() => {
                if (sun.intensity > 0) sun.intensity = camera.position.z / 20
            }).start()
            new TWEEN.Tween(viewTarget).easing(TWEEN.Easing.Quadratic.InOut).to({
                x: lookAt.x,
                y: lookAt.y,
                z: lookAt.z
            }, 400).start()
            camera.updateProjectionMatrix()
        }
        const toggleLight = (light) => {
            if (light.intensity !== 0) {
                light.setIntensity = light.intensity
                new TWEEN.Tween(light).to({
                    intensity: 0
                }, 100).start()
            } else {
                new TWEEN.Tween(light).to({
                    intensity: (light === sun ? camera.position.z / 20 : 1)
                }, 100).start()
            }
        }

        _.each(keyMap, (key) => {
            Mousetrap.bind(key.character, () => {
                if(key.pressed) return
                new TWEEN.Tween(key.mesh.position).to({
                    z: -.1
                }, 20).onComplete(() => {
                    key.pressed = true
                    if(key.action) key.action()
                }).start()
            })
            Mousetrap.bind(key.character, () => {
                key.pressed = false
                new TWEEN.Tween(key.mesh.position).to({
                    z: 0
                }, 80).delay(20).start()
            }, 'keyup')
        })

        const flexCamMouseControl = function (options, rendererDomElement) {
            const scope = this
            this.easing = options.easing
            this.scale = options.scale || .02
            this.modal = false
            this.target = options.target
            this.targetOffset = options.targetOffset
        
            this.mouseOffset = new THREE.Vector2(0, 0)
            this.cameraAngleDelta = new THREE.Vector2(0, 0)
            this.wheelSelector = 0
            this.tween = new TWEEN.Tween()
            this.tweenLoop
        
            this.getMouseOffset = (ev) => {
                scope.mouseOffset.set(2 * (ev.clientX - window.innerWidth / 2) / window.innerWidth, 2 * (window.innerHeight / 2 - ev.clientY) / window.innerHeight)
                return scope.mouseOffset
            }
            this.getCameraAngleDelta = () => {
                scope.mouseOffset.x < 0 ? scope.cameraAngleDelta.setX(-scope.easing(Math.abs(scope.mouseOffset.x))) : scope.cameraAngleDelta.setX(scope.easing(Math.abs(scope.mouseOffset.x)))
                scope.mouseOffset.y < 0 ? scope.cameraAngleDelta.setY(-scope.easing(Math.abs(scope.mouseOffset.y))) : scope.cameraAngleDelta.setY(scope.easing(Math.abs(scope.mouseOffset.y)))
                return scope.cameraAngleDelta
            }
        
            this.update = () => {
            }
        
            document.addEventListener('mousemove', (ev) => {
                if (scope.modal === true) return
                ev.preventDefault()
                ev.stopPropagation()
                let mouse = scope.getMouseOffset(ev)
                let camera = scope.getCameraAngleDelta()
            })
            document.addEventListener('wheel', (ev) => {
                if (scope.modal === true) return
                ev.preventDefault()
                ev.stopPropagation()
                scope.wheelSelector += ev.deltaY / Math.abs(ev.deltaY)
                // console.log(scope.wheelSelector)
            })
        }
        control = new flexCamMouseControl({
            easing: TWEEN.Easing.Quadratic.In
        }, renderer.domElement)

        clock = new THREE.Clock()

        let index = platforms.length - 1
        let t = setInterval(() => {
            let square = platforms[Math.floor(index * Math.random())]
            new TWEEN.Tween(square.rotation).easing(TWEEN.Easing.Quadratic.InOut).to({
                x: (square.rotation.x === 0 ? square.position.y / 20 : 0),
                y: (square.rotation.y === 0 ? -square.position.x / 20 : 0),
                z: 0
            }, 400).start()
        }, Math.random() * 450 + 50)

        moveCamera(
            new THREE.Vector3(0, -2, 17),
            new THREE.Vector3(0, -.1, 0),
        )
    }

    const render = () => {
        requestAnimationFrame(render)
        camera.lookAt(viewTarget)
        camera.rotateY(-control.cameraAngleDelta.x * control.scale)
        camera.rotateX(control.cameraAngleDelta.y * control.scale)

        raycaster.setFromCamera(pointer, camera)
        const intersects = raycaster.intersectObjects(scene.children);
        if (intersects.length > 0) { // if there is intersection with an object
            if (INTERSECTED != intersects[0].object) { // if intersecting new object
                if (INTERSECTED && INTERSECTED.onPointerOut) INTERSECTED.onPointerOut(INTERSECTED, scene) // return the previous intersected object to a non-intersected state
                INTERSECTED = intersects[0].object; // update intersected object referrence
                if (INTERSECTED.onPointerIn) INTERSECTED.onPointerIn(INTERSECTED, scene) // set intersected object to an intersecting state
            }
        } else { // if there is no intersection
            if (true) { // execute when no new intersection
                if (INTERSECTED && INTERSECTED.onPointerOut) INTERSECTED.onPointerOut(INTERSECTED, scene) // return the previous intersected object to a non-intersected state
                INTERSECTED = null;
            }
        }
        TWEEN.update()
        renderer.render(scene, camera)
    }

    initThree()
    render()
})