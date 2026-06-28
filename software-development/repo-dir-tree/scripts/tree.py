#!/usr/bin/env python3
import os
import sys

def print_tree(root, prefix=''):
    try:
        entries = sorted(os.listdir(root))
    except PermissionError:
        return
    # Filter out common ignored dirs/files
    entries = [e for e in entries if not e.startswith('.') and e != '__pycache__']
    for i, entry in enumerate(entries):
        path = os.path.join(root, entry)
        connector = '└── ' if i == len(entries) - 1 else '├── '
        print(prefix + connector + entry)
        if os.path.isdir(path):
            extension = '    ' if i == len(entries) - 1 else '│   '
            print_tree(path, prefix + extension)

if __name__ == '__main__':
    start_dir = os.getcwd()
    print(start_dir)
    print_tree(start_dir)
