import functools
import http.server
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
subprocess.run([sys.executable, str(ROOT / 'build.py')], check=True)
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT.parent))
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
print(f'http://127.0.0.1:{server.server_address[1]}/', flush=True)
server.serve_forever()
