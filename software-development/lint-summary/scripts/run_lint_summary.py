#!/usr/bin/env python3
import subprocess, sys, os

def main():
    # Run npm lint via a login shell to ensure PATH is loaded
    cmd = ["bash", "-lc", "npm run lint --silent"]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, env=os.environ)
    except FileNotFoundError:
        print("Error: bash not found.", file=sys.stderr)
        sys.exit(1)
    output = result.stdout + result.stderr
    if result.returncode != 0:
        lines = output.strip().splitlines()
        print("\n".join(lines[:20]))
        sys.exit(1)
    else:
        print("Lint passed with no errors.")
        sys.exit(0)

if __name__ == "__main__":
    main()
