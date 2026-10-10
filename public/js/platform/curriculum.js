export const STATUSES = {
  available: { label: "Available", kind: "available" },
  "in-development": { label: "In Development", kind: "soon" },
  planned: { label: "Planned", kind: "planned" },
  "coming-soon": { label: "Coming Soon", kind: "soon" },
};

export const LAB_FEATURES = [
  { id: "theory", title: "Theory", blurb: "Equations, worked examples, and predicted graphs live in a dedicated tab so the lab stays an experiment, not a textbook." },
  { id: "investigate", title: "Investigate", blurb: "Change one variable, watch the model respond immediately, and record trials into a table and graphs with a least-squares fit you can compare to Theory." },
  { id: "challenge", title: "Challenge", blurb: "Randomized unknowns hide the answer until you run the experiment. Reveal only after you have a measurement." },
  { id: "teacher", title: "Teacher view", blurb: "Compare live simulated values with the closed-form identities the course expects, without changing the student model." },
];

export const projectileSim = {
  id: "1-5",
  module: 1,
  number: "1.5",
  title: "Vectors and Motion in Two Dimensions",
  shortTitle: "Projectile Motion",
  description:
    "Investigate how launch angle, speed, and gravity affect trajectory, height, and range on flat ground.",
  status: "available",
  path: "/simulations/module-1/1-5",
  aliases: ["/simulations/projectile"],
  fullPage: true,
  objective: "Use two-dimensional kinematics to relate launch angle, hang time, height, and range.",
  topics: ["2D vectors", "projectile motion", "range", "launch angle"],
  features: ["theory", "challenge", "teacher", "trials", "autoRecord"],
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
        features: ["theory", "challenge", "teacher", "trials", "autoRecord"],
      },
      {
        id: "1-2",
        module: 1,
        number: "1.2",
        title: "Displacement, Velocity, and Acceleration",
        shortTitle: "Motion Quantities",
        description: "Explore how position, velocity, and acceleration change over time.",
        status: "available",
        path: "/simulations/module-1/1-2",
        objective: "Connect one-dimensional motion to average and instantaneous velocity and acceleration, including graphs and direction change.",
        topics: ["displacement", "velocity", "acceleration", "time", "motion graphs"],
        features: ["theory", "challenge", "teacher", "trials", "autoRecord"],
      },
      {
        id: "1-3",
        module: 1,
        number: "1.3",
        title: "Representing Motion",
        shortTitle: "Representing Motion",
        description: "Connect motion diagrams, graphs, vectors, and numerical descriptions of the same motion.",
        status: "available",
        path: "/simulations/module-1/1-3",
        objective: "Connect the same motion to a motion diagram, x–t, v–t, and a–t graphs, and numerical values.",
        topics: ["motion diagrams", "position-time graphs", "velocity-time graphs", "acceleration-time graphs", "motion representations"],
        features: ["theory", "challenge", "teacher", "trials", "autoRecord"],
      },
      {
        id: "1-4",
        module: 1,
        number: "1.4",
        title: "Reference Frames and Relative Motion",
        shortTitle: "Reference Frames",
        description: "Explore how position and velocity change when viewed from different reference frames.",
        status: "available",
        path: "/simulations/module-1/1-4",
        objective: "Describe the same one-dimensional motion from the ground and from moving observers using relative position and velocity.",
        topics: ["reference frames", "relative position", "relative velocity", "moving observers", "one-dimensional relative motion"],
        features: ["theory", "challenge", "teacher", "trials", "autoRecord"],
      },
      projectileSim,
    ],
  },
  {
    id: 2,
    slug: "module-2",
    title: "Dynamics",
    description: "Use forces and Newton’s laws to explain changes in motion.",
    path: "/simulations/module-2",
    simulations: [
      {
        id: "2-1",
        number: "2.1",
        title: "Systems and Center of Mass",
        shortTitle: "Systems & Center of Mass",
        description: "Explore how multiple objects can be analyzed as a system using the center of mass.",
        status: "available",
        path: "/simulations/module-2/2-1",
        objective: "Define a system, locate its center of mass, and contrast internal motion with the motion of the system as a whole.",
        topics: ["systems", "center of mass", "center-of-mass position", "center-of-mass velocity", "mass distribution", "internal forces", "external forces"],
        features: ["theory", "challenge", "teacher", "trials", "autoRecord"],
      },
      {
        id: "2-2",
        number: "2.2",
        title: "Forces and Free-Body Diagrams",
        shortTitle: "Forces & Free-Body Diagrams",
        description: "Identify forces acting on an object, construct free-body diagrams, and calculate net force.",
        status: "available",
        path: "/simulations/module-2/2-2",
        objective: "Identify the external forces on a selected object, represent them as vectors on a free-body diagram, and determine the net force.",
        topics: ["forces", "force vectors", "free-body diagrams", "gravity", "normal force", "friction", "tension", "applied force", "net force"],
        features: ["theory", "challenge", "teacher", "trials", "autoRecord"],
      },
      {
        id: "2-3",
        number: "2.3",
        title: "Newton's Third Law",
        shortTitle: "Newton's Third Law",
        description: "Identify interaction pairs: equal in magnitude, opposite in direction, and acting on different objects.",
        status: "available",
        path: "/simulations/module-2/2-3",
        objective: "Show that an interaction produces a pair of forces that are equal in magnitude, opposite in direction, and exerted on two different objects.",
        topics: ["Newton's third law", "interaction pairs", "force pairs", "source and target", "equal and opposite", "mass vs acceleration", "internal forces"],
        features: ["theory", "challenge", "teacher", "trials", "autoRecord"],
      },
      {
        id: "2-4",
        number: "2.4",
        title: "Newton's First Law",
        shortTitle: "Newton's First Law",
        description: "Show that zero net force means constant velocity — including rest — not the absence of motion or of individual forces.",
        status: "available",
        path: "/simulations/module-2/2-4",
        objective: "If the net external force is zero, velocity remains constant. Rest is the special case v = 0. Inertia is not a force.",
        topics: ["Newton's first law", "inertia", "equilibrium", "net force", "constant velocity", "friction"],
        features: ["theory", "challenge", "teacher", "trials", "autoRecord"],
      },
      {
        id: "2-5",
        number: "2.5",
        title: "Newton's Second Law",
        shortTitle: "Newton's Second Law",
        description: "Show that acceleration is the net force divided by mass, and that its direction matches F_net rather than velocity.",
        status: "available",
        path: "/simulations/module-2/2-5",
        objective: "The acceleration of an object is directly proportional to the net external force and inversely proportional to its mass.",
        topics: ["Newton's second law", "net force", "mass", "acceleration", "F = ma", "friction"],
        features: ["theory", "challenge", "teacher", "trials", "autoRecord"],
      },
      {
        id: "2-6",
        number: "2.6",
        title: "Gravitational Force",
        shortTitle: "Gravitational Force",
        description: "Show that gravitational force is an attractive pair: Fg = G m1 m2 / r², with r measured center to center.",
        status: "available",
        path: "/simulations/module-2/2-6",
        objective: "Gravitational force is an attractive interaction between masses. Fg = G m1 m2 / r². Near Earth, Fg = mg is the same law.",
        topics: ["universal gravitation", "inverse square", "force pair", "gravitational field", "g vs G", "Earth", "center-to-center"],
        features: ["theory", "challenge", "teacher", "trials", "autoRecord"],
      },
      {
        id: "2-7",
        number: "2.7",
        title: "Kinetic and Static Friction",
        shortTitle: "Kinetic and Static Friction",
        description: "Show that static friction balances up to μs N, while kinetic friction is μk N opposite sliding.",
        status: "available",
        path: "/simulations/module-2/2-7",
        objective: "Static friction adjusts as needed up to μs N. Kinetic friction is μk N opposite relative sliding. The two are different models.",
        topics: ["static friction", "kinetic friction", "normal force", "coefficient of friction", "threshold", "Newton's laws"],
        features: ["theory", "challenge", "teacher", "trials", "autoRecord"],
      },
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
    features: sim.features || ["theory", "challenge", "teacher", "trials", "autoRecord"],
    fullPage: Boolean(sim.fullPage),
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

export function fullPagePaths() {
  return modules.flatMap((mod) =>
    mod.simulations.flatMap((sim) => (sim.fullPage ? [sim.path, ...(sim.aliases || [])] : [])),
  );
}
