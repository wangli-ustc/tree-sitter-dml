package tree_sitter_dml_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_dml "github.com/wangli-ustc/tree-sitter-dml/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_dml.Language())
	if language == nil {
		t.Errorf("Error loading dml grammar")
	}
}
