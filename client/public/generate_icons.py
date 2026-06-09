"""Generate stub-192.png and stub-512.png using pure Python stdlib (no Pillow)."""
import struct
import zlib
import os

def create_png(width, height, r, g, b):
    """Create a minimal solid-color PNG with the given dimensions and RGB color."""
    def chunk(chunk_type, data):
        c = chunk_type + data
        crc = struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)
        return struct.pack(">I", len(data)) + c + crc

    # PNG signature
    sig = b'\x89PNG\r\n\x1a\n'

    # IHDR
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    ihdr = chunk(b'IHDR', ihdr_data)

    # IDAT - raw image data with filter byte 0 per row
    raw_rows = b''
    for y in range(height):
        raw_rows += b'\x00'  # filter: none
        raw_rows += bytes([r, g, b]) * width

    compressed = zlib.compress(raw_rows)
    idat = chunk(b'IDAT', compressed)

    # IEND
    iend = chunk(b'IEND', b'')

    return sig + ihdr + idat + iend


# Theme orange (#f5a623)
orange_rgb = (0xf5, 0xa6, 0x23)

os.chdir(os.path.dirname(os.path.abspath(__file__)))

for size in [192, 512]:
    png_data = create_png(size, size, *orange_rgb)
    filename = f'stub-{size}.png'
    with open(filename, 'wb') as f:
        f.write(png_data)
    print(f'Created {filename} ({len(png_data)} bytes)')
