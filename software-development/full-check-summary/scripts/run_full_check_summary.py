#!/usr/bin/env python3
import subprocess, sys, os

def run_script(script_path):
    cmd = ["bash", "-lc", f"python {script_path}"]
    result = subprocess.run(cmd, capture_output=True, text=True, env=os.environ)
    return result

def main():
    scripts = [
        "software-development/lint-summary/scripts/run_lint_summary.py",
        "software-development/type-check-summary/scripts/run_type_check_summary.py",
        "software-development/run-tests-summary/scripts/run_tests_summary.py",
    ]
    overall_success = True
    for script in scripts:
        result = run_script(script)
        output = result.stdout + result.stderr
        print(output.strip())
        if result.returncode != 0:
            overall_success = False
    if overall_success:
        print("All checks passed.")
        sys.exit(0)
    else:
        print("One or more checks failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
