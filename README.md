# AP Physics 1 — Launch Angle vs. Range

Interactive lab for projectile motion on flat ground with no air resistance. Students change launch angle, initial speed, and gravity, then collect trials to discover that **45° produces the maximum range** when launch and landing heights are equal.

## Run

```bash
npm install
npm test
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Physics

The browser animation and the Node test suite share `lib/projectile.js`. Motion is integrated with `dt = 0.01 s`:

```text
x  += vx * dt
vy += -g * dt
y  += vy * dt
```

Displayed range, maximum height, and flight time come from that same state. Closed-form checks:

```text
R = v0² sin(2θ) / g
H = v0² sin²(θ) / (2g)
T = 2 v0 sin(θ) / g
```

Enable **Teacher view** in the lab to compare simulated and analytical values.

## Suggested investigation

Keep `v0 = 20 m/s` and `g = 9.8 m/s²`. Record trials at 30°, 45°, and 60°.
