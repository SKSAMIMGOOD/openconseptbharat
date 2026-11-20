import { crc32 } from "../image/dpi-metadata.ts";

export interface ZipEntry {
  name: string;
  data: Uint8Array | ArrayBuffer;
  lastModified?: Date;
}

/**
 * Creates a standard uncompressed (STORE) ZIP archive compliant with PKWare ZIP specification.
 * Fully synchronous in-memory binary generation suitable for browser environments.
 * Zero external dependencies.
 */
export function createZipArchive(entries: ZipEntry[]): Blob {
  // 1. Prepare normalized entry data
  const normalized = entries.map((entry) => {
    const nameBytes = new TextEncoder().encode(entry.name);
    const dataBytes =
      entry.data instanceof Uint8Array ? entry.data : new Uint8Array(entry.data);
    const date = entry.lastModified || new Date();
    const dosTime =
      ((date.getHours() << 11) |
        (date.getMinutes() << 5) |
        (Math.floor(date.getSeconds() / 2))) &
      0xffff;
    const dosDate =
      (((date.getFullYear() - 1980) << 9) |
        ((date.getMonth() + 1) << 5) |
        date.getDate()) &
      0xffff;
    const checksum = crc32(dataBytes);

    return {
      nameBytes,
      dataBytes,
      dosTime,
      dosDate,
      checksum,
      size: dataBytes.length,
    };
  });

  // 2. Calculate exact total buffer size
  let localHeadersTotalSize = 0;
  let centralDirectoryTotalSize = 0;

  for (const item of normalized) {
    // Local header: 30 bytes + name length + data length
    localHeadersTotalSize += 30 + item.nameBytes.length + item.size;
    // Central directory header: 46 bytes + name length
    centralDirectoryTotalSize += 46 + item.nameBytes.length;
  }

  // End of Central Directory record: 22 bytes
  const totalArchiveSize = localHeadersTotalSize + centralDirectoryTotalSize + 22;

  const buffer = new Uint8Array(totalArchiveSize);
  const view = new DataView(buffer.buffer);

  let offset = 0;
  const localHeaderOffsets: number[] = [];

  // 3. Write Local File Headers + File Data
  for (const item of normalized) {
    localHeaderOffsets.push(offset);

    // Signature: 0x04034b50 (PK\x03\x04)
    view.setUint32(offset, 0x04034b50, true);
    // Version needed to extract: 20 (0x0014)
    view.setUint16(offset + 4, 20, true);
    // General purpose flag: bit 11 (0x0800) for UTF-8 filename
    view.setUint16(offset + 6, 0x0800, true);
    // Compression method: 0 (STORE, uncompressed)
    view.setUint16(offset + 8, 0, true);
    // File modification time
    view.setUint16(offset + 10, item.dosTime, true);
    // File modification date
    view.setUint16(offset + 12, item.dosDate, true);
    // CRC-32
    view.setUint32(offset + 14, item.checksum, true);
    // Compressed size
    view.setUint32(offset + 18, item.size, true);
    // Uncompressed size
    view.setUint32(offset + 22, item.size, true);
    // File name length
    view.setUint16(offset + 26, item.nameBytes.length, true);
    // Extra field length: 0
    view.setUint16(offset + 28, 0, true);

    offset += 30;

    // File name
    buffer.set(item.nameBytes, offset);
    offset += item.nameBytes.length;

    // File data
    buffer.set(item.dataBytes, offset);
    offset += item.size;
  }

  // 4. Write Central Directory Headers
  const centralDirStartOffset = offset;

  for (let i = 0; i < normalized.length; i++) {
    const item = normalized[i];
    const localOffset = localHeaderOffsets[i];

    // Signature: 0x02014b50 (PK\x01\x02)
    view.setUint32(offset, 0x02014b50, true);
    // Version made by: 20
    view.setUint16(offset + 4, 20, true);
    // Version needed: 20
    view.setUint16(offset + 6, 20, true);
    // General purpose flag: bit 11 (0x0800) for UTF-8 filename
    view.setUint16(offset + 8, 0x0800, true);
    // Compression method: 0 (STORE)
    view.setUint16(offset + 10, 0, true);
    // File modification time
    view.setUint16(offset + 12, item.dosTime, true);
    // File modification date
    view.setUint16(offset + 14, item.dosDate, true);
    // CRC-32
    view.setUint32(offset + 16, item.checksum, true);
    // Compressed size
    view.setUint32(offset + 20, item.size, true);
    // Uncompressed size
    view.setUint32(offset + 24, item.size, true);
    // File name length
    view.setUint16(offset + 28, item.nameBytes.length, true);
    // Extra field length: 0
    view.setUint16(offset + 30, 0, true);
    // File comment length: 0
    view.setUint16(offset + 32, 0, true);
    // Disk number start: 0
    view.setUint16(offset + 34, 0, true);
    // Internal file attributes: 0
    view.setUint16(offset + 36, 0, true);
    // External file attributes: 0
    view.setUint32(offset + 38, 0, true);
    // Relative offset of local header
    view.setUint32(offset + 42, localOffset, true);

    offset += 46;

    // File name
    buffer.set(item.nameBytes, offset);
    offset += item.nameBytes.length;
  }

  const centralDirSize = offset - centralDirStartOffset;

  // 5. Write End of Central Directory Record (EOCD)
  // Signature: 0x06054b50 (PK\x05\x06)
  view.setUint32(offset, 0x06054b50, true);
  // Number of this disk: 0
  view.setUint16(offset + 4, 0, true);
  // Disk where central directory starts: 0
  view.setUint16(offset + 6, 0, true);
  // Number of central directory records on this disk
  view.setUint16(offset + 8, normalized.length, true);
  // Total number of central directory records
  view.setUint16(offset + 10, normalized.length, true);
  // Size of central directory
  view.setUint32(offset + 12, centralDirSize, true);
  // Offset of start of central directory
  view.setUint32(offset + 16, centralDirStartOffset, true);
  // Comment length: 0
  view.setUint16(offset + 20, 0, true);

  return new Blob([buffer.buffer], { type: "application/zip" });
}
