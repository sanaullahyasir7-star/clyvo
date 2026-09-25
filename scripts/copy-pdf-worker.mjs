import { copyFile, cp, mkdir, readFile } from "node:fs/promises";
const root = new URL("../", import.meta.url);
const pkg = JSON.parse(
  await readFile(new URL("node_modules/pdfjs-dist/package.json", root), "utf8"),
);
await mkdir(new URL("public/", root), { recursive: true });
await copyFile(
  new URL("node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs", root),
  new URL(`public/pdf.worker-${pkg.version}.min.mjs`, root),
);

for (const folder of ["standard_fonts", "cmaps"]) {
  await cp(
    new URL(`node_modules/pdfjs-dist/${folder}/`, root),
    new URL(`public/pdf-assets-${pkg.version}/${folder}/`, root),
    { recursive: true },
  );
}
