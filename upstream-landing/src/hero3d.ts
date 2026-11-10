import {
  BufferGeometry,
  Float32BufferAttribute,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from 'three'

/*
 * One scene, one Points object, one ShaderMaterial. ~5,000 scattered points drift UPWARD (upstream) and lean in toward
 * the centre as they rise, like tributaries joining a stream. Motion is computed entirely on the GPU from a single time
 * uniform; the pointer gently parts the flow. A soft hole is cut around the headline so the text stays clean, and the
 * scatter is random (no grid), so there is no moire. The CPU only updates three uniforms per frame, and rendering stops
 * while the hero is off screen.
 */
const COUNT = 5200
const W = 38   // half-ish width of the field in world units
const H = 14   // height of the loop in world units
const D = 14   // depth

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uScroll;
  uniform float uPx;
  attribute float aSpeed;
  attribute float aPhase;
  attribute float aSize;
  varying float vA;
  varying float vMix;

  const float H = ${H.toFixed(1)};

  void main() {
    vec3 p = position;

    // rise, wrapping around the loop height
    float y = mod(p.y + uTime * aSpeed + H * 0.5, H) - H * 0.5;
    float k = (y + H * 0.5) / H;            // 0 at the bottom of the loop, 1 at the top

    // sway a little, and lean toward the centre as the stream rises
    float x = p.x + sin(uTime * 0.35 + aPhase) * 0.5;
    x *= mix(1.0, 0.42, smoothstep(0.0, 1.0, k));

    vec3 q = vec3(x, y, p.z);

    // the pointer parts the flow
    vec2 m = vec2(uPointer.x * 13.0, uPointer.y * 6.0);
    vec2 d = q.xy - m;
    float dist = length(d) + 0.0001;
    q.xy += d / dist * exp(-dist * dist * 0.12) * 1.6;

    vec4 mv = modelViewMatrix * vec4(q, 1.0);
    gl_Position = projectionMatrix * mv;

    float depth = -mv.z;
    gl_PointSize = aSize * uPx * (10.0 / depth);

    // fade in at the bottom, out at the top, and with distance
    float edge = smoothstep(0.0, 0.14, k) * (1.0 - smoothstep(0.78, 1.0, k));

    // keep the headline area clear: a soft ellipse around the centre of the screen
    vec2 ndc = gl_Position.xy / gl_Position.w;
    float hole = smoothstep(0.28, 0.85, length((ndc - vec2(0.0, 0.12)) * vec2(0.75, 1.15)));

    vA = edge * hole * smoothstep(34.0, 10.0, depth) * (1.0 - clamp(uScroll, 0.0, 1.0));
    vMix = smoothstep(0.35, 1.0, k);
  }
`

const fragmentShader = /* glsl */ `
  varying float vA;
  varying float vMix;

  void main() {
    float r = length(gl_PointCoord - 0.5);
    if (r > 0.5) discard;
    float edge = smoothstep(0.5, 0.28, r);
    vec3 ink = vec3(0.04, 0.04, 0.07);
    vec3 accent = vec3(0.294, 0.173, 0.941);
    gl_FragColor = vec4(mix(ink, accent, vMix), edge * vA * 0.9);
  }
`

export function initHero(canvas: HTMLCanvasElement): () => void {
  let renderer: WebGLRenderer
  try {
    renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' })
  } catch {
    return () => {} // no WebGL: the page stands on its own without the scene
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const pr = Math.min(window.devicePixelRatio, 2)
  renderer.setPixelRatio(pr)
  renderer.setClearColor(0x000000, 0)

  const scene = new Scene()
  const camera = new PerspectiveCamera(40, 1, 0.1, 80)
  camera.position.set(0, 0, 14)

  const positions = new Float32Array(COUNT * 3)
  const speed = new Float32Array(COUNT)
  const phase = new Float32Array(COUNT)
  const size = new Float32Array(COUNT)
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * W
    positions[i * 3 + 1] = (Math.random() - 0.5) * H
    positions[i * 3 + 2] = (Math.random() - 0.5) * D
    speed[i] = 0.18 + Math.random() * 0.5
    phase[i] = Math.random() * Math.PI * 2
    size[i] = 1.1 + Math.pow(Math.random(), 2.2) * 3.4
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('aSpeed', new Float32BufferAttribute(speed, 1))
  geometry.setAttribute('aPhase', new Float32BufferAttribute(phase, 1))
  geometry.setAttribute('aSize', new Float32BufferAttribute(size, 1))

  const uniforms = {
    uTime: { value: reduceMotion ? 6 : 0 },
    uPointer: { value: new Vector2(0, 0) },
    uScroll: { value: 0 },
    uPx: { value: pr },
  }
  const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: false })
  const points = new Points(geometry, material)
  points.frustumCulled = false
  scene.add(points)

  const target = new Vector2(0, 0)
  const onPointer = (e: PointerEvent) => {
    target.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1))
  }
  if (!reduceMotion) window.addEventListener('pointermove', onPointer, { passive: true })

  const resize = () => {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.render(scene, camera)
  }
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)

  const start = performance.now()
  const frame = () => {
    uniforms.uTime.value = (performance.now() - start) / 1000
    uniforms.uPointer.value.lerp(target, 0.06)
    uniforms.uScroll.value = window.scrollY / (window.innerHeight * 0.9)
    renderer.render(scene, camera)
  }

  // Draw only while the hero is on screen.
  const io = new IntersectionObserver(([e]) => {
    if (reduceMotion) return
    renderer.setAnimationLoop(e.isIntersecting ? frame : null)
  })
  io.observe(canvas)

  resize()
  canvas.dataset.ready = 'true'

  return () => {
    io.disconnect()
    ro.disconnect()
    window.removeEventListener('pointermove', onPointer)
    renderer.setAnimationLoop(null)
    geometry.dispose()
    material.dispose()
    renderer.dispose()
  }
}
