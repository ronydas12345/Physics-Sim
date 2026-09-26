/**
 * Least-squares polynomial fits for lab scatter plots.
 * Independent of projectile physics so the same helper can serve later sims.
 */

export function uniqueXCount(points) {
  const seen = new Set();
  for (const point of points) {
    if (Number.isFinite(point.x)) seen.add(point.x);
  }
  return seen.size;
}

export function canFit(points, { minPoints = 2 } = {}) {
  const clean = points.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  return clean.length >= minPoints && uniqueXCount(clean) >= 2;
}

function solveLinearSystem(matrix, vector) {
  const n = vector.length;
  const rows = matrix.map((row, i) => [...row, vector[i]]);
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < n; row += 1) {
      if (Math.abs(rows[row][col]) > Math.abs(rows[pivot][col])) pivot = row;
    }
    if (Math.abs(rows[pivot][col]) < 1e-12) return null;
    [rows[col], rows[pivot]] = [rows[pivot], rows[col]];
    const div = rows[col][col];
    for (let j = col; j <= n; j += 1) rows[col][j] /= div;
    for (let row = 0; row < n; row += 1) {
      if (row === col) continue;
      const factor = rows[row][col];
      for (let j = col; j <= n; j += 1) rows[row][j] -= factor * rows[col][j];
    }
  }
  return rows.map((row) => row[n]);
}

export function evaluatePolynomial(coeffs, x) {
  let acc = 0;
  let power = 1;
  for (const coeff of coeffs) {
    acc += coeff * power;
    power *= x;
  }
  return acc;
}

export function polynomialFit(points, { maxDegree = 2, xScale = 90 } = {}) {
  const clean = points.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  const unique = uniqueXCount(clean);
  if (clean.length < 2 || unique < 2) return null;

  const degree = Math.min(maxDegree, unique - 1, clean.length - 1);
  const scale = xScale === 0 ? 1 : xScale;
  const xs = clean.map((p) => p.x / scale);
  const ys = clean.map((p) => p.y);
  const size = degree + 1;
  const A = Array.from({ length: size }, () => Array(size).fill(0));
  const b = Array(size).fill(0);

  for (let i = 0; i < clean.length; i += 1) {
    const x = xs[i];
    const y = ys[i];
    for (let j = 0; j < size; j += 1) {
      b[j] += y * x ** j;
      for (let k = 0; k < size; k += 1) {
        A[j][k] += x ** (j + k);
      }
    }
  }

  const scaledCoeffs = solveLinearSystem(A, b);
  if (!scaledCoeffs) return null;

  const coeffs = scaledCoeffs.map((c, j) => c / scale ** j);
  const yMean = ys.reduce((sum, y) => sum + y, 0) / ys.length;
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < clean.length; i += 1) {
    const predicted = evaluatePolynomial(coeffs, clean[i].x);
    ssRes += (ys[i] - predicted) ** 2;
    ssTot += (ys[i] - yMean) ** 2;
  }
  const r2 = ssTot < 1e-12 ? (ssRes < 1e-12 ? 1 : 0) : 1 - ssRes / ssTot;

  return {
    degree,
    coeffs,
    r2,
    evaluate(x) {
      return evaluatePolynomial(coeffs, x);
    },
  };
}

function formatAbsCoeff(value) {
  const abs = Math.abs(value);
  if (abs >= 100) return abs.toFixed(1);
  if (abs >= 10) return abs.toFixed(2);
  if (abs >= 1) return abs.toFixed(2);
  if (abs >= 0.1) return abs.toFixed(3);
  if (abs >= 0.01) return abs.toFixed(3);
  if (abs >= 0.001) return abs.toFixed(4);
  return abs.toFixed(5);
}

function powerLabel(xName, power) {
  if (power === 0) return "";
  if (power === 1) return xName;
  return `${xName}²`;
}

export function formatFitEquation(fit, yName = "y", xName = "θ") {
  if (!fit?.coeffs?.length) return "";
  const terms = [];
  fit.coeffs.forEach((coeff, power) => {
    if (Math.abs(coeff) < 1e-8 && power !== 0) return;
    const body = formatAbsCoeff(coeff);
    const variable = powerLabel(xName, power);
    const piece = variable ? `${body} ${variable}` : body;
    if (!terms.length) {
      terms.push(coeff < 0 ? `−${piece}` : piece);
      return;
    }
    terms.push(`${coeff < 0 ? "−" : "+"} ${piece}`);
  });
  return `${yName} = ${terms.join(" ")}`;
}

export function formatR2(r2) {
  if (!Number.isFinite(r2)) return "—";
  return r2.toFixed(3);
}

export function sampleFit(fit, { start = 0, end = 90, steps = 90 } = {}) {
  if (!fit) return [];
  const out = [];
  for (let i = 0; i <= steps; i += 1) {
    const x = start + ((end - start) * i) / steps;
    out.push({ x, y: fit.evaluate(x) });
  }
  return out;
}

export function fitTrials(trials, key) {
  return polynomialFit(trials.map((trial) => ({ x: trial.angleDeg, y: trial[key] })));
}
