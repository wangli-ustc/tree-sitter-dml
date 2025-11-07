import XCTest
import SwiftTreeSitter
import TreeSitterDml

final class TreeSitterDmlTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_dml())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading dml grammar")
    }
}
