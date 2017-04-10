# Voronoi Fracture

## See it live [here](link_to_come)

## Concept

This is an experiment on procedurally generating a 2D Voronoi fracture in 3D with three.js

First random 2D points are generated in viewport space, using either a Gaussian (normal) or uniform distribution. The half-edge representation of a Voronoi diagram from these points is then computed using the excellent [Javascript Voronoi](https://github.com/gorhill/Javascript-Voronoi) by gorhill.

The cells from this Voronoi diagram are then extruded into their own 3D geometry.

For performance reasons, every cell is then put into a single buffer geometry. Lighting and Simplex noise displacement is then done in a custom GLSL shader.

## Usage

Clone the repo, then :

### Install dependencies

```sh
yarn
```

or

```sh
npm install
```

### Run live-server

```sh
npm run dev
```

### Build

```sh
npm run build
```

### Disclaimer

This is my first time programming a shader, if you see anything weird / suboptimal in the GLSL code, please tell me ;)

### License

See LICENSE.MD
