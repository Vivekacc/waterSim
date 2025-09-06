import * as THREE from 'three';
import html2canvas from 'html2canvas';
import { vertex, fragment, displacmentVertex, displacmentFragment } from './shader.js';

const scene = new THREE.Scene();
const simScene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const mouse = new THREE.Vector2();
const width = window.innerWidth * window.devicePixelRatio;
const height = window.innerHeight * window.devicePixelRatio;

const option = {
  format: THREE.RGBAFormat,
  type: THREE.FloatType,
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  stencilBuffer: false,
  depthBuffer: false
};

let rtA = new THREE.WebGLRenderTarget(width, height, option);
let rtB = new THREE.WebGLRenderTarget(width, height, option);

const simMaterial = new THREE.ShaderMaterial({
  uniforms: {
    textureA: { value: null },
    mouse: { value: mouse },
    resolution: { value: new THREE.Vector2(width, height) },
    time: { value: 0 },
    frame: { value: 0 },
  },
  vertexShader: vertex,
  fragmentShader: fragment
});

const renderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    textureA: { value: null },
    textureB: { value: null },
  },
  vertexShader: displacmentVertex,
  fragmentShader: displacmentFragment
});

const plane = new THREE.PlaneGeometry(2, 2);
const simQuad = new THREE.Mesh(plane, simMaterial);
const renderQuad = new THREE.Mesh(plane, renderMaterial);
simScene.add(simQuad);
scene.add(renderQuad);

// HTML to Canvas
const htmlElement = document.getElementById('htmlContent');
const canvas = document.getElementById('htmlCanvas');

html2canvas(htmlElement, {
  canvas: canvas,
//   backgroundColor: ,
  scale: window.devicePixelRatio
}).then(() => {
  const textTexture = new THREE.CanvasTexture(canvas);
  textTexture.minFilter = THREE.LinearFilter;
  textTexture.magFilter = THREE.LinearFilter;
  textTexture.format = THREE.RGBAFormat;
  renderMaterial.uniforms.textureB.value = textTexture;
});

// Resize
window.addEventListener('resize', () => {
  const newWidth = window.innerWidth * window.devicePixelRatio;
  const newHeight = window.innerHeight * window.devicePixelRatio;
  renderer.setSize(window.innerWidth, window.innerHeight);
  rtA.setSize(newWidth, newHeight);
  rtB.setSize(newWidth, newHeight);
  simMaterial.uniforms.resolution.value.set(newWidth, newHeight);
});

// Mouse
renderer.domElement.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX * window.devicePixelRatio;
  mouse.y = (window.innerHeight - e.clientY) * window.devicePixelRatio;
});
renderer.domElement.addEventListener("mouseleave", () => {
  mouse.set(0, 0);
});

// Animate
let frame = 0;
function animate() {
  simMaterial.uniforms.frame.value = frame++;
  simMaterial.uniforms.time.value = performance.now() / 1000;
  simMaterial.uniforms.textureA.value = rtA.texture;

  renderer.setRenderTarget(rtB);
  renderer.render(simScene, camera);

  renderMaterial.uniforms.textureA.value = rtB.texture;
  renderer.setRenderTarget(null);
  renderer.render(scene, camera);

  [rtA, rtB] = [rtB, rtA];
  requestAnimationFrame(animate);
}
animate();
