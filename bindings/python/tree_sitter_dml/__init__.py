"""Tree-sitter bindings for DML (Device Modeling Language)."""

from pathlib import Path

def language():
    """Return the tree-sitter Language for DML."""
    try:
        # Try new API (tree-sitter >= 0.21)
        import tree_sitter_dml.binding as binding
        return binding.language()
    except (ImportError, AttributeError):
        pass
    
    # Fall back to loading from shared library (tree-sitter < 0.21)
    try:
        import tree_sitter
        
        # Get the path to the shared library
        lib_path = Path(__file__).parent.parent.parent.parent / "dml.so"
        
        if not lib_path.exists():
            raise FileNotFoundError(
                f"Parser library not found at {lib_path}. "
                "Please run 'tree-sitter build' first."
            )
        
        # Old API: Language(path, name)
        try:
            return tree_sitter.Language(str(lib_path), "dml")
        except TypeError:
            # Even older API or different signature
            pass
        
        # Try loading with ctypes directly
        import ctypes
        lib = ctypes.cdll.LoadLibrary(str(lib_path))
        language_func = lib.tree_sitter_dml
        language_func.restype = ctypes.c_void_p
        return tree_sitter.Language(language_func())
        
    except Exception as e:
        raise ImportError(
            f"Failed to load DML language: {e}\n"
            "Please ensure:\n"
            "1. tree-sitter is installed: pip install tree-sitter\n"
            "2. Parser is built: npx tree-sitter build\n"
            "3. dml.so exists in the project root"
        )

__all__ = ["language"]
