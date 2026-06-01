import sys

# Force UTF-8 console output so Cyrillic / arrows never crash on a cp1251
# (Windows) terminal.
for stream in (sys.stdout, sys.stderr):
    try:
        stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

from src.cli import main

if __name__ == "__main__":
    main()
