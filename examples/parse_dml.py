#!/usr/bin/env python3
"""
Example script showing how to parse DML files using tree-sitter-dml.

Usage:
    python examples/parse_dml.py <dml_file>
"""

import sys
from pathlib import Path

# Add the bindings directory to the path
sys.path.insert(0, str(Path(__file__).parent.parent / "bindings" / "python"))

import tree_sitter_dml
from tree_sitter import Parser, Language


def parse_dml_file(file_path):
    """Parse a DML file and return the syntax tree."""
    # Load the DML language
    DML_LANGUAGE = tree_sitter_dml.language()
    
    # Create a parser with the language
    # In tree-sitter >= 0.23, Parser() takes the language directly
    parser = Parser(DML_LANGUAGE)
    
    # Read the file
    with open(file_path, 'rb') as f:
        source_code = f.read()
    
    # Parse the file
    tree = parser.parse(source_code)
    
    return tree, source_code


def print_tree(node, source_code, indent=0):
    """Recursively print the syntax tree."""
    # Get the text for this node
    node_text = source_code[node.start_byte:node.end_byte].decode('utf-8')
    
    # Truncate long text
    if len(node_text) > 50:
        node_text = node_text[:47] + "..."
    
    # Replace newlines for display
    node_text = node_text.replace('\n', '\\n')
    
    # Print the node
    print("  " * indent + f"{node.type}: {repr(node_text)}")
    
    # Print children
    for child in node.children:
        print_tree(child, source_code, indent + 1)


def find_nodes_by_type(node, node_type):
    """Find all nodes of a specific type."""
    results = []
    
    if node.type == node_type:
        results.append(node)
    
    for child in node.children:
        results.extend(find_nodes_by_type(child, node_type))
    
    return results


def find_import_statements(node, source_code):
    """Find all import statements and extract the imported file paths."""
    imports = []
    
    def traverse(n):
        # Look for 'toplevel' nodes that contain import statements
        if n.type == 'toplevel':
            # Check if this is an import statement
            # Import structure: toplevel -> import, utf8_sconst, ;
            children = n.children
            if len(children) >= 3:
                if children[0].type == 'import':
                    # The second child should be the utf8_sconst (string literal)
                    for child in children:
                        if child.type == 'utf8_sconst':
                            # Extract the string literal text
                            import_text = source_code[child.start_byte:child.end_byte].decode('utf-8')
                            imports.append((n, import_text))
                            break
        
        # Continue traversing
        for child in n.children:
            traverse(child)
    
    traverse(node)
    return imports


def analyze_dml_file(file_path):
    """Analyze a DML file and print statistics."""
    tree, source_code = parse_dml_file(file_path)
    root = tree.root_node
    
    print(f"=== Parsing {file_path} ===\n")
    
    # Print basic info
    print(f"Root node type: {root.type}")
    print(f"Number of children: {len(root.children)}")
    print(f"Parse errors: {root.has_error}\n")
    
    # Find specific node types
    devices = find_nodes_by_type(root, "device_declaration")
    registers = find_nodes_by_type(root, "register_declaration")
    fields = find_nodes_by_type(root, "field_declaration")
    methods = find_nodes_by_type(root, "method_declaration")
    imports = find_import_statements(root, source_code)
    
    print(f"Statistics:")
    print(f"  Devices: {len(devices)}")
    print(f"  Registers: {len(registers)}")
    print(f"  Fields: {len(fields)}")
    print(f"  Methods: {len(methods)}")
    print(f"  Imports: {len(imports)}")
    print()
    
    # Print import statements
    if imports:
        print("Import Statements:")
        for i, (import_node, import_path) in enumerate(imports, 1):
            print(f"  {i}. {import_path}")
        print()
    
    # Print the first few lines of the tree
    print("Syntax tree (first 20 levels):")
    print_tree_limited(root, source_code, max_depth=20)
    
    return tree, source_code


def print_tree_limited(node, source_code, indent=0, max_depth=10):
    """Print syntax tree with depth limit."""
    if indent >= max_depth:
        return
    
    # Get the text for this node
    node_text = source_code[node.start_byte:node.end_byte].decode('utf-8')
    
    # Truncate long text
    if len(node_text) > 50:
        node_text = node_text[:47] + "..."
    
    # Replace newlines for display
    node_text = node_text.replace('\n', '\\n')
    
    # Print the node
    print("  " * indent + f"{node.type}: {repr(node_text)}")
    
    # Print children
    for child in node.children:
        print_tree_limited(child, source_code, indent + 1, max_depth)


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python parse_dml.py <dml_file>")
        print("\nExample:")
        print("  python examples/parse_dml.py examples/sample.dml")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not Path(file_path).exists():
        print(f"Error: File not found: {file_path}")
        sys.exit(1)
    
    try:
        analyze_dml_file(file_path)
    except FileNotFoundError as e:
        print(f"Error: {e}")
        print("\nPlease build the parser first:")
        print("  npx tree-sitter generate")
        print("  npx tree-sitter build")
        sys.exit(1)
    except Exception as e:
        print(f"Error parsing file: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
