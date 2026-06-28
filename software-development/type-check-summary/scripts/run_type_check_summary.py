#!/usr/bin/env python3
import subprocess, sys, os

def main():
    # Run TypeScript compiler in noEmit mode via npx to ensure local version
    cmd = ["bash", "-lc", "npx tsc --noEmit"]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, env=os.environ)
    except FileNotFoundError:
        print("Error: bash not found.", file=sys.stderr)
        sys.exit(1)
    output = result.stdout + result.stderr
    if result.returncode != 0:
        # Show first few error lines
        lines = output.strip().splitlines()
        print("\n".join(lines[:20]))
        sys.exit(1)
    else:
        print("TypeScript type check passed with no errors.")
        sys.exit(0)

if __name__ == "__main__":
    main()
