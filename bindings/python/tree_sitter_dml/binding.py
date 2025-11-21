"""Binding module for tree-sitter-dml (for tree-sitter >= 0.21)."""

from pathlib import Path
import ctypes

def language():
    """Load and return the DML language."""
    import tree_sitter
    
    # Get the path to the shared library
    lib_path = Path(__file__).parent.parent.parent.parent / "dml.so"
    
    if not lib_path.exists():
        raise FileNotFoundError(
            f"Parser library not found at {lib_path}. "
            "Please run 'tree-sitter build' first."
        )
    
    # For tree-sitter >= 0.23, we need to load the library with ctypes
    # and get the language function pointer
    lib = ctypes.cdll.LoadLibrary(str(lib_path))
    lang_func = lib.tree_sitter_dml
    lang_func.restype = ctypes.c_void_p
    lang_ptr = lang_func()
    
    return tree_sitter.Language(lang_ptr)
