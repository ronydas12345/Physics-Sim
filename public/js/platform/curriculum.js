export const STATUSES = {
  available: { label: "Available", kind: "available" },
  "in-development": { label: "In Development", kind: "soon" },
  planned: { label: "Planned", kind: "planned" },
  "coming-soon": { label: "Coming Soon", kind: "soon" },
};

export const projectileSim = {
  id: "projectile",
  module: 1,
  number: null,
  title: "Projectile Motion",
  shortTitle: "Projectile Motion",
  description:
    "Investigate how launch angle, speed, and gravity affect trajectory, height, and range.",
  status: "available",
  path: "/simulations/projectile",
  legacy: true,
  badge: "Existing Simulation",
  topics: ["projectile motion", "range", "launch angle"],
};

export const modules = [
  {
    id: 1,
    slug: "module-1",
    title: "Kinematics",
    description: "Describe motion without yet asking what forces cause it.",
    path: "/simulations/module-1",
    simulations: [
      {
        id: "1-1",
        module: 1,
        number: "1.1",
        title: "Scalars and Vectors in One Dimension",
        shortTitle: "Scalars & Vectors",
        description: "Explore magnitude, direction, distance, and displacement on a number line.",
        status: "available",
        path: "/simulations/module-1/1-1",
        objective: "Distinguish scalar and vector quantities using position, distance, and displacement.",
        topics: ["scalars", "vectors", "distance", "displacement"],
      },
      {
        id: "1-2",
        module: 1,
        number: "1.2",
        title: "Displacement, Velocity, and Acceleration",
        shortTitle: "Motion Quantities",
        description: "Connect changes in position to velocity and acceleration.",
        status: "planned",
        path: "/simulations/module-1/1-2",
        topics: ["velocity", "acceleration"],
      },
      {
        id: "1-3",
        module: 1,
        number: "1.3",
        title: "Representing Motion",
        shortTitle: "Representing Motion",
        description: "Read and build graphs, diagrams, and motion maps.",
        status: "planned",
        path: "/simulations/module-1/1-3",
        topics: ["graphs", "motion maps"],
      },
      {
        id: "1-4",
        module: 1,
        number: "1.4",
        title: "Reference Frames and Relative Motion",
        shortTitle: "Reference Frames",
        description: "See how observers in different frames describe the same motion.",
        status: "planned",
        path: "/simulations/module-1/1-4",
        topics: ["reference frames"],
      },
      {
        id: "1-5",
        module: 1,
        number: "1.5",
        title: "Vectors and Motion in Two Dimensions",
        shortTitle: "2D Motion",
        description: "Combine perpendicular components to describe two-dimensional motion.",
        status: "planned",
        path: "/simulations/module-1/1-5",
        topics: ["2D vectors", "projectile motion"],
      },
    ],
  },
  {
    id: 2,
    slug: "module-2",
    title: "Dynamics",
    description: "Use forces and Newton’s laws to explain changes in motion.",
    path: "/simulations/module-2",
    simulations: [
      { id: "2-1", number: "2.1", title: "Systems and Center of Mass", status: "planned" },
      { id: "2-2", number: "2.2", title: "Forces and Free-Body Diagrams", status: "planned" },
      { id: "2-3", number: "2.3", title: "Newton's Third Law", status: "planned" },
      { id: "2-4", number: "2.4", title: "Newton's First Law", status: "planned" },
      { id: "2-5", number: "2.5", title: "Newton's Second Law", status: "planned" },
      { id: "2-6", number: "2.6", title: "Gravitational Force", status: "planned" },
      { id: "2-7", number: "2.7", title: "Kinetic and Static Friction", status: "planned" },
      { id: "2-8", number: "2.8", title: "Spring Forces", status: "planned" },
      { id: "2-9", number: "2.9", title: "Circular Motion", status: "planned" },
    ],
  },
  {
    id: 3,
    slug: "module-3",
    title: "Work, Energy, and Power",
    description: "Track energy transfers and transformations in mechanical systems.",
    path: "/simulations/module-3",
    simulations: [
      { id: "3-1", number: "3.1", title: "Translational Kinetic Energy", status: "planned" },
      { id: "3-2", number: "3.2", title: "Work", status: "planned" },
      { id: "3-3", number: "3.3", title: "Potential Energy", status: "planned" },
      { id: "3-4", number: "3.4", title: "Conservation of Energy", status: "planned" },
      { id: "3-5", number: "3.5", title: "Power", status: "planned" },
    ],
  },
  {
    id: 4,
    slug: "module-4",
    title: "Linear Momentum",
    description: "Use momentum and impulse to analyze collisions and interactions.",
    path: "/simulations/module-4",
    simulations: [
      { id: "4-1", number: "4.1", title: "Linear Momentum", status: "planned" },
      { id: "4-2", number: "4.2", title: "Change in Momentum and Impulse", status: "planned" },
      { id: "4-3", number: "4.3", title: "Conservation of Linear Momentum", status: "planned" },
      { id: "4-4", number: "4.4", title: "Elastic and Inelastic Collisions", status: "planned" },
    ],
  },
  {
    id: 5,
    slug: "module-5",
    title: "Rotational Motion",
    description: "Extend kinematics and Newton’s laws to rotation.",
    path: "/simulations/module-5",
    simulations: [
      { id: "5-1", number: "5.1", title: "Rotational Kinematics", status: "planned" },
      { id: "5-2", number: "5.2", title: "Connecting Linear and Rotational Motion", status: "planned" },
      { id: "5-3", number: "5.3", title: "Torque", status: "planned" },
      { id: "5-4", number: "5.4", title: "Rotational Inertia", status: "planned" },
      { id: "5-5", number: "5.5", title: "Rotational Equilibrium", status: "planned" },
      { id: "5-6", number: "5.6", title: "Newton's Second Law in Rotational Form", status: "planned" },
    ],
  },
  {
    id: 6,
    slug: "module-6",
    title: "Energy and Momentum of Rotating Systems",
    description: "Apply energy and angular momentum to rolling and orbiting systems.",
    path: "/simulations/module-6",
    simulations: [
      { id: "6-1", number: "6.1", title: "Rotational Kinetic Energy", status: "planned" },
      { id: "6-2", number: "6.2", title: "Torque and Work", status: "planned" },
      { id: "6-3", number: "6.3", title: "Angular Momentum and Angular Impulse", status: "planned" },
      { id: "6-4", number: "6.4", title: "Conservation of Angular Momentum", status: "planned" },
      { id: "6-5", number: "6.5", title: "Rolling", status: "planned" },
      { id: "6-6", number: "6.6", title: "Motion of Orbiting Satellites", status: "planned" },
    ],
  },
  {
    id: 7,
    slug: "module-7",
    title: "Simple Harmonic Motion",
    description: "Model repeating motion with restoring forces proportional to displacement.",
    path: "/simulations/module-7",
    simulations: [
      { id: "7-1", number: "7.1", title: "Defining Simple Harmonic Motion", status: "planned" },
      { id: "7-2", number: "7.2", title: "Frequency and Period of SHM", status: "planned" },
      { id: "7-3", number: "7.3", title: "Representing and Analyzing SHM", status: "planned" },
      { id: "7-4", number: "7.4", title: "Energy of Simple Harmonic Oscillators", status: "planned" },
    ],
  },
  {
    id: 8,
    slug: "module-8",
    title: "Fluids",
    description: "Apply density, pressure, and conservation laws to liquids and gases.",
    path: "/simulations/module-8",
    simulations: [
      { id: "8-1", number: "8.1", title: "Internal Structure and Density", status: "planned" },
      { id: "8-2", number: "8.2", title: "Pressure", status: "planned" },
      { id: "8-3", number: "8.3", title: "Fluids and Newton's Laws", status: "planned" },
      { id: "8-4", number: "8.4", title: "Fluids and Conservation Laws", status: "planned" },
    ],
  },
].map((mod) => ({
  ...mod,
  simulations: mod.simulations.map((sim) => ({
    module: mod.id,
    shortTitle: sim.shortTitle || sim.title,
    description: sim.description || "",
    path: sim.path || `/simulations/${mod.slug}/${sim.id}`,
    topics: sim.topics || [],
    ...sim,
  })),
}));

export function getModule(id) {
  return modules.find((mod) => mod.id === Number(id)) ?? null;
}

export function getSimulation(moduleId, simId) {
  return getModule(moduleId)?.simulations.find((sim) => sim.id === simId) ?? null;
}

export function availableCount(mod) {
  return mod.simulations.filter((sim) => sim.status === "available").length;
}

export function statusLabel(status) {
  return STATUSES[status]?.label ?? "Planned";
}
