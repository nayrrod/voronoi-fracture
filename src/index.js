import css from './css/main.css'
import * as THREE from 'three'
import Voronoi from 'voronoi'
import Prob from 'prob.js'
import Dat from 'dat.gui/build/dat.gui.min'
import Stats from 'stats.js'

let OrbitControls = require('three-orbit-controls')(THREE)

// Import shaders using glslify-loader
let vertShader = require('./shaders/shader.vert')
let fragShader = require('./shaders/shader.frag')

let scene, camera, renderer, clock, shaderMaterial, raycaster, mouse, bufferMesh
let guiParams, stats
let width, height, halfWidth, halfHeight

init()
initGui(guiParams)
animate()

function init() {
  const canvas = document.getElementById('threejs-canvas')
  width = window.innerWidth
  height = window.innerHeight
  halfWidth = width / 2
  halfHeight = height / 2

  // Initialize params for dat.gui
  guiParams = {
    noiseScale: 0.00307,
    noiseDisplacement: 50.0,
    sites: 5000,
    distribution: 'beehive',
    theme: 'neon'
  }

  scene = new THREE.Scene()

  // Setup camera
  camera = new THREE.PerspectiveCamera(75, width / height, 1, 10000)
  camera.position.z = 500

  // Setup renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false
  });

  // Set renderer size and pixel ratio
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio ?
    window.devicePixelRatio :
    1)


  let controls = new OrbitControls(camera, renderer.domElement)
  camera.rotation.z += Math.PI / 2
  // controls.rotateZ(Math.PI/2)
  clock = new THREE.Clock()

  // Setup stats.js
  stats = new Stats()
  stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
  stats.dom.style.cssText = 'position: fixed; right: 0; bottom: 0; z-index: 500;'
  document.body.appendChild(stats.dom)

  let vertices = getPointsForDistribution(guiParams.sites, guiParams.distribution, width, height)

  // Generate the data-only voronoi diagram from those vertices
  let voronoiDiagram = generateVoronoiDiagram(-halfWidth, halfWidth, -halfHeight, halfHeight, vertices)

  // Generate three.js shapes from each cell in the voronoi diagram
  let shapeArray = voronoiDiagram.cells.map(getVoronoiShape)

  // Extrude these shapes into actual geometry
  let geomArray = extrudeShapes(shapeArray)

  // Put every geometry in a single buffer mesh with custom shader material
  bufferMesh = getBufferMesh(geomArray)
  scene.add(bufferMesh)

  // window.addEventListener('mousemove', onMouseMove, false);
}

function getRandom2DVertices(sitesCount, distribution, width, height) {
  let isGaussian = distribution == 'gaussian' ? true : false
  let isUniform = distribution == 'uniform' ? true : false
  let randGeneratorX
  let randGeneratorY
  if (isGaussian) {
    randGeneratorX = Prob.normal(0, 0.3)
    randGeneratorY = Prob.normal(0, 0.3)
  } else {
    randGeneratorX = Prob.uniform(-1.0, 1.0)
    randGeneratorY = Prob.uniform(-1.0, 1.0)
  }

  const halfWidth = width / 2
  const halfHeight = height / 2
  // Here we fill an array with random 2D vertices in viewport space
  const verticesCount = sitesCount
  let vertices = new Array(verticesCount).fill({})
  vertices = vertices.map(() => {
    let x = randGeneratorX() * halfWidth
    let y = randGeneratorY() * halfHeight
    // discard the point if it does not fall into viewport space, needed for gaussian distribution
    if (x < -halfWidth || x > halfWidth || y < -halfHeight || y > halfHeight) {
      return {
        x: 0,
        y: 0
      }
    }
    return {
      x,
      y
    }
  })
  return vertices
}

function getPointsForDistribution(sites, distribution, width, height) {
  let points
  if (distribution === 'uniform' || distribution === 'gaussian') {
    points = getRandom2DVertices(sites, distribution, width, height)
  } else if (distribution === 'beehive') {
    points = getEquidistantPoints(width, height, sites)
  }

  return points
}

function extrudeShapes(shapeArray) {
  const extrudeSettings = {
    amount: 100,
    bevelEnabled: false,
    bevelSegments: 0,
    steps: 1,
    bevelSize: 0,
    bevelThickness: 0
  }

  let geomArray = []
  for (let i = 0; i < shapeArray.length; i++) {
    if (shapeArray[i].curves.length === 0) continue
    let cellGeom = new THREE.ExtrudeGeometry(shapeArray[i], extrudeSettings)
    cellGeom.computeBoundingBox()
    var cellBBox = cellGeom.boundingBox
    var cellCenter = {
      x: cellBBox.min.x + (cellBBox.max.x - cellBBox.min.x) / 2,
      y: cellBBox.min.y + (cellBBox.max.y - cellBBox.min.y) / 2,
      z: cellBBox.min.z + (cellBBox.max.z - cellBBox.min.z) / 2
    }
    cellGeom.center()
    cellGeom.cellCenter = cellCenter
    geomArray.push(cellGeom)
  }
  return geomArray
}

function getBufferMesh(geomArray) {
  let positions = []
  let normals = []
  let colors = []
  let center = []

  geomArray.forEach(function (geometry, index, array) {
    let color = new THREE.Color(0xffffff);
    color.setHSL((index / array.length), 1.0, 0.7);

    geometry.faces.forEach(function (face, index) {
      positions.push(geometry.vertices[face.a].x + geometry.cellCenter.x);
      positions.push(geometry.vertices[face.a].y + geometry.cellCenter.y);
      positions.push(geometry.vertices[face.a].z + geometry.cellCenter.z);
      positions.push(geometry.vertices[face.b].x + geometry.cellCenter.x);
      positions.push(geometry.vertices[face.b].y + geometry.cellCenter.y);
      positions.push(geometry.vertices[face.b].z + geometry.cellCenter.z);
      positions.push(geometry.vertices[face.c].x + geometry.cellCenter.x);
      positions.push(geometry.vertices[face.c].y + geometry.cellCenter.y);
      positions.push(geometry.vertices[face.c].z + geometry.cellCenter.z);

      normals.push(face.normal.x);
      normals.push(face.normal.y);
      normals.push(face.normal.z);
      normals.push(face.normal.x);
      normals.push(face.normal.y);
      normals.push(face.normal.z);
      normals.push(face.normal.x);
      normals.push(face.normal.y);
      normals.push(face.normal.z);

      center.push(geometry.cellCenter.x)
      center.push(geometry.cellCenter.y)
      center.push(geometry.cellCenter.z)
      center.push(geometry.cellCenter.x)
      center.push(geometry.cellCenter.y)
      center.push(geometry.cellCenter.z)
      center.push(geometry.cellCenter.x)
      center.push(geometry.cellCenter.y)
      center.push(geometry.cellCenter.z)
    })
  })

  let bufferGeometry = new THREE.BufferGeometry()
  bufferGeometry.addAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  bufferGeometry.addAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  bufferGeometry.addAttribute('center', new THREE.Float32BufferAttribute(center, 3))


  let isWhite = guiParams.theme === 'neon' ? 0.0 : 1.0

  shaderMaterial = new THREE.ShaderMaterial({
    vertexShader: vertShader,
    fragmentShader: fragShader,
    uniforms: {
      time: {
        value: 1.0
      },
      resolution: {
        value: new THREE.Vector2()
      },
      noiseScale: {
        value: guiParams.noiseScale
      },
      noiseDisplacement: {
        value: guiParams.noiseDisplacement
      },
      isWhite: {
        value: isWhite
      }
    }
  })
  shaderMaterial.uniforms.resolution.value.x = width
  shaderMaterial.uniforms.resolution.value.y = height

  bufferMesh = new THREE.Mesh(bufferGeometry, shaderMaterial)
  return bufferMesh
}

function initGui(params) {
  let gui = new Dat.GUI()

  gui.add(params, 'theme', ['neon', 'white']).name('Theme').onFinishChange(function (val) {
    if (val === 'neon') shaderMaterial.uniforms.isWhite.value = 0.0
    else if (val === 'white') shaderMaterial.uniforms.isWhite.value = 1.0
  })

  // Voronoi Folder
  let f1 = gui.addFolder('Voronoi (CPU bound)')
  f1.closed = false
  f1.add(params, 'sites').min(10).max(50000).step(1).name('Cells count').onFinishChange(function (val) {
    scene.remove(bufferMesh)
    let vertices = getPointsForDistribution(guiParams.sites, guiParams.distribution, width, height)
    let voronoiDiagram = generateVoronoiDiagram(-width / 2, width / 2, -height / 2, height / 2, vertices)
    let shapeArray = voronoiDiagram.cells.map(getVoronoiShape)
    let geomArray = extrudeShapes(shapeArray)
    bufferMesh = getBufferMesh(geomArray)
    scene.add(bufferMesh)
  })

  f1.add(params, 'distribution', ['gaussian', 'uniform', 'beehive']).name('Distribution').onFinishChange(function (val) {
    scene.remove(bufferMesh)
    let vertices = getPointsForDistribution(guiParams.sites, guiParams.distribution, width, height)
    let voronoiDiagram = generateVoronoiDiagram(-width / 2, width / 2, -height / 2, height / 2, vertices)
    let shapeArray = voronoiDiagram.cells.map(getVoronoiShape)
    let geomArray = extrudeShapes(shapeArray)
    bufferMesh = getBufferMesh(geomArray)
    scene.add(bufferMesh)
  })

  // Noise Folder
  let f2 = gui.addFolder('Noise (GPU bound)')
  f2.closed = false
  f2.add(params, 'noiseScale').min(0.0001).max(0.01).step(0.00001).name('Scale').onChange(function (val) {
    shaderMaterial.uniforms.noiseScale.value = val
  })
  f2.add(params, 'noiseDisplacement').min(0.0).max(400.0).step(1.0).name('Displacement').onChange(function (val) {
    shaderMaterial.uniforms.noiseDisplacement.value = val
  })
}


function generateVoronoiDiagram(xMin, xMax, yMin, yMax, sites) {
  let voronoi = new Voronoi()
  let boundingBox = {
    xl: xMin,
    xr: xMax,
    yt: yMin,
    yb: yMax
  };
  let voronoiDiagram = voronoi.compute(sites, boundingBox)
  return voronoiDiagram
}

function getVoronoiShape(cell) {
  let shape = new THREE.Shape();
  for (let i = 0; i < cell.halfedges.length; i++) {
    let startPoint = cell.halfedges[i].getStartpoint();
    let endPoint = cell.halfedges[i].getEndpoint();
    if (i === 0) {
      shape.moveTo(startPoint.x, startPoint.y);
    }
    shape.lineTo(endPoint.x, endPoint.y);
  }
  return shape
}

function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

// TODO: not an actual equidistant representation, needs another param for ratio between xOffset and yoffset + renaming function
function getEquidistantPoints(width, height, count) {
  // DEBUG
  // var canvas = document.getElementById("debug-canvas");
  // canvas.width = window.innerWidth
  // canvas.height = window.innerHeight
  // var ctx = canvas.getContext("2d");
  // ctx.fillStyle = '#FF0000'
  // let xOffset =
  let oddRowRatio = 1.5
  let xOffset = Math.sqrt(((width * height) / count))
  let vertices = []
  let oddRow = false

  let x = 0
  let y = 0
  while (x < width) {
    y = oddRow ? xOffset * oddRowRatio : 0
    while (y < height) {

      vertices.push({
        x: x - halfWidth,
        y: y - halfHeight
      })
      y += xOffset
    }
    oddRow = !oddRow
    x += xOffset
  }
  console.log(vertices.length)
  return vertices
}

function animate() {
  requestAnimationFrame(animate)
  stats.begin()
  shaderMaterial.uniforms.time.value = clock.getElapsedTime()
  renderer.render(scene, camera)
  stats.end()
}
