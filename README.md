# AP Physics 1 Simulation Platform

Interactive labs organized by AP Physics 1 module. This phase includes the platform shell, Module 1 navigation, **1.1 Scalars and Vectors in One Dimension**, and the existing projectile-motion lab.

## Run

```bash
npm install
npm test
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

- `/` home
- `/simulations` library
- `/simulations/module-1` kinematics
- `/simulations/module-1/1-1` scalars and vectors
- `/simulations/projectile` existing projectile lab
- `/about` help

## Projectile lab

The original launch-angle simulation is unchanged in its physics engine (`lib/projectile.js`) and is available from the home page and library as an existing simulation while 1.5 (two-dimensional motion) is planned.
