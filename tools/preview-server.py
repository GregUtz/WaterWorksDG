from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import os
from urllib.parse import urlsplit, urlunsplit


class PreviewHandler(SimpleHTTPRequestHandler):
    def guess_type(self, path):
        if Path(path).name == '2026-leaderboard':
            return 'text/html; charset=utf-8'
        return super().guess_type(path)

    def do_GET(self):
        parsed = urlsplit(self.path)
        requested = Path(parsed.path.lstrip('/'))
        if parsed.path.endswith('.html') and not requested.exists():
            extensionless = Path(str(requested)[:-5])
            if extensionless.is_file():
                self.path = urlunsplit(('', '', '/' + extensionless.as_posix(), parsed.query, parsed.fragment))
        super().do_GET()

    def log_message(self, _format, *_args):
        pass


parser = argparse.ArgumentParser(description='Serve the WaterWorks site for local preview.')
parser.add_argument('--port', type=int, default=4173)
parser.add_argument('--directory', default='.')
args = parser.parse_args()

os.chdir(args.directory)
ThreadingHTTPServer(('127.0.0.1', args.port), PreviewHandler).serve_forever()
