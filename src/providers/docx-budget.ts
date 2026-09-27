/** Inspect ZIP directory sizes before decompression. Reject ZIP64 and huge archives. */
export function validateDocxArchive(bytes: ArrayBuffer) {
  const view = new DataView(bytes);
  let end = -1;
  for (
    let i = view.byteLength - 22;
    i >= Math.max(0, view.byteLength - 65557);
    i--
  ) {
    if (
      view.getUint32(i, true) === 0x06054b50 &&
      i + 22 + view.getUint16(i + 20, true) === view.byteLength
    ) {
      end = i;
      break;
    }
  }
  if (end < 0) throw new Error("The Word archive is damaged.");
  const entries = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true),
    total = 0;
  if (entries > 2000 || offset === 0xffffffff)
    throw new Error("This Word archive is too complex. Export a simpler CV.");
  for (let n = 0; n < entries; n++) {
    if (offset + 46 > end || view.getUint32(offset, true) !== 0x02014b50)
      throw new Error("The Word archive is damaged.");
    const size = view.getUint32(offset + 24, true);
    total += size;
    if (size === 0xffffffff || total > 25 * 1024 * 1024)
      throw new Error(
        "This Word document expands beyond the 25 MB reading limit. Export a simpler CV.",
      );
    offset +=
      46 +
      view.getUint16(offset + 28, true) +
      view.getUint16(offset + 30, true) +
      view.getUint16(offset + 32, true);
  }
}
