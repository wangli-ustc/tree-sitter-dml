"""Setup script for tree-sitter-dml Python bindings."""

from setuptools import setup, find_packages

setup(
    name="tree-sitter-dml",
    version="0.1.0",
    description="DML grammar for tree-sitter",
    author="wangli-ustc",
    license="MIT",
    packages=find_packages(),
    install_requires=[
        "tree-sitter>=0.20.0",
    ],
    python_requires=">=3.7",
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
)
