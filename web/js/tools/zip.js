// Store-only (no-compression) ZIP generator. Pure, dependency-free, and runs
// on old smartphone browsers. Shared by the tools that export a data bundle
// (stills + CSV/JSON). Tested in web/tests/tools.test.mjs.
//
// files: [{ name: string, data: Uint8Array }] → Blob (application/zip)
export function makeZip(files) {
  const parts = [];
  const centralDirectory = [];
  let offset = 0;
  const crcTable = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    crcTable[i] = c;
  }
  function getCrc(data) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < data.length; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xff];
    return (crc ^ (-1)) >>> 0;
  }
  const date = new Date();
  const dosTime = ((date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1)) & 0xffff;
  const dosDate = (((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()) & 0xffff;

  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name);
    const dataBytes = file.data;
    const crc = getCrc(dataBytes);
    const size = dataBytes.length;
    const lfh = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(lfh.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 10, true);
    view.setUint16(6, 0, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, dosTime, true);
    view.setUint16(12, dosDate, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, size, true);
    view.setUint32(22, size, true);
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true);
    lfh.set(nameBytes, 30);
    parts.push(lfh, dataBytes);

    const cdh = new Uint8Array(46 + nameBytes.length);
    const cdhView = new DataView(cdh.buffer);
    cdhView.setUint32(0, 0x02014b50, true);
    cdhView.setUint16(4, 20, true);
    cdhView.setUint16(6, 10, true);
    cdhView.setUint16(8, 0, true);
    cdhView.setUint16(10, 0, true);
    cdhView.setUint16(12, dosTime, true);
    cdhView.setUint16(14, dosDate, true);
    cdhView.setUint32(16, crc, true);
    cdhView.setUint32(20, size, true);
    cdhView.setUint32(24, size, true);
    cdhView.setUint16(28, nameBytes.length, true);
    cdhView.setUint16(30, 0, true);
    cdhView.setUint16(32, 0, true);
    cdhView.setUint16(34, 0, true);
    cdhView.setUint16(36, 0, true);
    cdhView.setUint32(38, 0, true);
    cdhView.setUint32(42, offset, true);
    cdh.set(nameBytes, 46);
    centralDirectory.push(cdh);
    offset += lfh.length + size;
  }

  const cdhStart = offset;
  let cdhSize = 0;
  for (const cdh of centralDirectory) {
    parts.push(cdh);
    cdhSize += cdh.length;
  }
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(4, 0, true);
  eocdView.setUint16(6, 0, true);
  eocdView.setUint16(8, files.length, true);
  eocdView.setUint16(10, files.length, true);
  eocdView.setUint32(12, cdhSize, true);
  eocdView.setUint32(16, cdhStart, true);
  eocdView.setUint16(20, 0, true);
  parts.push(eocd);
  return new Blob(parts, { type: "application/zip" });
}
