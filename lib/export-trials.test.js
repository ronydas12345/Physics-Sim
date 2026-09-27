import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatCsv, formatTxt, formatXlsx } from "./export-trials.js";

describe("trial export", () => {
  const columns = ["Trial", "Range (m)"];
  const rows = [
    [1, 40.8],
    [2, 30.1],
  ];

  it("writes a tab-separated text table with a title", () => {
    const text = formatTxt("1.5 Projectile", columns, rows);
    assert.match(text, /^1\.5 Projectile\nRecorded trials/);
    assert.match(text, /Trial\tRange \(m\)/);
    assert.match(text, /1\t40\.8/);
  });

  it("quotes CSV cells that contain commas", () => {
    const csv = formatCsv(["Note"], [["hello, world"]]);
    assert.equal(csv.trim(), 'Note\r\n"hello, world"');
  });

  it("builds an xlsx zip with a worksheet", () => {
    const bytes = formatXlsx("Trials", columns, rows);
    assert.equal(bytes[0], 0x50);
    assert.equal(bytes[1], 0x4b);
    assert.equal(bytes[2], 0x03);
    assert.equal(bytes[3], 0x04);
    const asText = new TextDecoder().decode(bytes);
    assert.match(asText, /xl\/worksheets\/sheet1\.xml/);
    assert.match(asText, /40\.8/);
  });
});
