#!/usr/bin/env python3
import subprocess
import sys
import re
import os

def main():
    # Run the npm test command in the project root via bash login shell to ensure PATH
    try:
        result = subprocess.run([
            "bash", "-lc", "npm run test --silent"
        ], capture_output=True, text=True, env=os.environ)
    except FileNotFoundError:
        print("Error: bash not found.", file=sys.stderr)
        sys.exit(1)

    output = result.stdout + result.stderr
    # Search for the summary line produced by Vitest, e.g., "=== 123 passed, 2 failed in 12.34s ==="
    match = re.search(r"===\s*([\d,]+) passed(?:,\s*([\d,]+) failed)?[^=]*===", output)
    if match:
        passed = match.group(1)
        failed = match.group(2) if match.group(2) else "0"
        duration_match = re.search(r"in\s+([\d.]+)s", output)
        duration = duration_match.group(1) if duration_match else ""
        summary = f"{passed} passed, {failed} failed"
        if duration:
            summary += f" in {duration}s"
        print(summary)
        sys.exit(0 if int(failed.replace(',', '')) == 0 else 1)
    else:
        # If no match, print the full output for debugging
        print(output)
        sys.exit(1)

if __name__ == "__main__":
    main()
