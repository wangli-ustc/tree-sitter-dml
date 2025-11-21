/**
 * @file Device Modeling Language (DML) grammar for Tree-sitter
 * @author wangli-ustc
 * @license MIT
 * @description Grammar for DML 1.4 - Device Modeling Language used in Intel Simics
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default grammar({
  name: "dml",

  extras: $ => [
    /\s/,
    $.comment,
  ],

  word: $ => $.identifier,

  conflicts: $ => [
    [$.statement_except_hashif, $.stmt_or_case],
  ],

  rules: {
    // ============================================================
    // Top-Level: dml
    // ============================================================
    
    source_file: $ => seq(
      optional($.provisional_declaration),
      optional($.device_declaration),
      optional($.bitorder_declaration),
      repeat($.device_statement)
    ),

    provisional_declaration: $ => seq(
      'provisional',
      sep1($.ident, ','),
      ';'
    ),

    device_declaration: $ => seq(
      'device',
      $.objident,
      ';'
    ),

    bitorder_declaration: $ => seq(
      'bitorder',
      $.ident,
      ';'
    ),

    // ============================================================
    // Device Statements
    // ============================================================

    device_statement: $ => choice(
      $.toplevel,
      $.object,
      $.toplevel_param,
      $.method,
      $.bad_shared_method,
      seq($.istemplate, ';'),
      $.toplevel_if,
      $.error_stmt,
      $.in_each
    ),

    toplevel_param: $ => $.param,

    toplevel_if: $ => seq(
      $.hashif,
      '(',
      $.expression,
      ')',
      '{',
      repeat($.device_statement),
      '}',
      optional($.toplevel_else)
    ),

    toplevel_else: $ => choice(
      seq($.hashelse, '{', repeat($.device_statement), '}'),
      seq($.hashelse, $.toplevel_if)
    ),

    // ============================================================
    // Objects
    // ============================================================

    object: $ => choice(
      // register
      seq(
        'register',
        $.objident,
        repeat($.array_spec),
        optional($.sizespec),
        optional($.offsetspec),
        optional($.istemplate),
        $.object_spec
      ),
      // field
      seq(
        'field',
        $.objident,
        repeat($.array_spec),
        optional($.bitrangespec),
        optional($.istemplate),
        $.object_spec
      ),
      // session_decl
      $.session_decl,
      // saved_decl
      $.saved_decl,
      // Other objects
      seq('connect', $.objident, repeat($.array_spec), optional($.istemplate), $.object_spec),
      seq('interface', $.objident, repeat($.array_spec), optional($.istemplate), $.object_spec),
      seq('attribute', $.objident, repeat($.array_spec), optional($.istemplate), $.object_spec),
      seq('bank', $.objident, repeat($.array_spec), optional($.istemplate), $.object_spec),
      seq('event', $.objident, repeat($.array_spec), optional($.istemplate), $.object_spec),
      seq('group', $.objident, repeat($.array_spec), optional($.istemplate), $.object_spec),
      seq('port', $.objident, repeat($.array_spec), optional($.istemplate), $.object_spec),
      seq('implement', $.objident, repeat($.array_spec), optional($.istemplate), $.object_spec),
      seq('subdevice', $.objident, repeat($.array_spec), optional($.istemplate), $.object_spec),
      // hook_decl
      $.hook_decl
    ),

    array_spec: $ => seq(
      '[',
      $.arraydef,
      ']'
    ),

    arraydef: $ => choice(
      seq($.ident, '<', $.expression),
      seq($.ident, '<', '...')
    ),

    sizespec: $ => seq('size', $.expression),

    offsetspec: $ => seq('@', $.expression),

    bitrangespec: $ => seq('@', $.bitrange),

    bitrange: $ => choice(
      seq('[', $.expression, ']'),
      seq('[', $.expression, ':', $.expression, ']')
    ),

    session_decl: $ => choice(
      seq($.data, $.named_cdecl, ';'),
      seq($.data, $.named_cdecl, '=', $.initializer, ';'),
      seq($.data, '(', $.cdecl_list_nonempty, ')', ';'),
      seq($.data, '(', $.cdecl_list_nonempty, ')', '=', $.initializer, ';')
    ),

    saved_decl: $ => choice(
      seq('saved', $.named_cdecl, ';'),
      seq('saved', $.named_cdecl, '=', $.initializer, ';'),
      seq('saved', '(', $.cdecl_list_nonempty, ')', ';'),
      seq('saved', '(', $.cdecl_list_nonempty, ')', '=', $.initializer, ';')
    ),

    data: $ => 'session',

    hook_decl: $ => seq(
      'hook',
      '(',
      optional($.cdecl_list_nonempty),
      ')',
      $.ident,
      repeat(seq('[', $.expression, ']')),
      ';'
    ),

    // ============================================================
    // Methods
    // ============================================================

    method: $ => choice(
      seq(
        optional($.method_qualifiers),
        'method',
        $.objident,
        $.method_params_typed,
        optional('default'),
        $.compound_statement
      ),
      seq(
        'inline',
        'method',
        $.objident,
        $.method_params_maybe_untyped,
        optional('default'),
        $.compound_statement
      )
    ),

    method_qualifiers: $ => choice(
      'independent',
      seq('independent', 'startup'),
      seq('independent', 'startup', 'memoized')
    ),

    method_params_typed: $ => seq(
      '(',
      optional($.cdecl_list_nonempty),
      ')',
      optional($.method_outparams),
      optional($.throws)
    ),

    method_params_maybe_untyped: $ => seq(
      '(',
      optional($.cdecl_or_ident_list2),
      ')',
      optional($.method_outparams),
      optional($.throws)
    ),

    method_outparams: $ => seq(
      '->',
      '(',
      $.cdecl_list_nonempty,
      ')'
    ),

    throws: $ => 'throws',

    bad_shared_method: $ => seq(
      'shared',
      optional($.method_qualifiers),
      'method',
      $.shared_method
    ),

    shared_method: $ => choice(
      seq($.ident, $.method_params_typed, ';'),
      seq($.ident, $.method_params_typed, 'default', $.compound_statement),
      seq($.ident, $.method_params_typed, $.compound_statement)
    ),

    // ============================================================
    // Templates and Top-Level Declarations
    // ============================================================

    toplevel: $ => choice(
      seq('template', $.objident, optional($.istemplate), '{', repeat($.template_stmt), '}'),
      seq('header', '%{', $.c_code, '}%'),
      seq('footer', '%{', $.c_code, '}%'),
      seq('_header', '%{', $.c_code, '}%'),
      seq('loggroup', $.ident, ';'),
      seq('constant', $.ident, '=', $.expression, ';'),
      seq('extern', $.cdecl, ';'),
      seq('typedef', $.named_cdecl, ';'),
      seq('extern', 'typedef', $.named_cdecl, ';'),
      seq('import', $.utf8_sconst, ';'),
      seq('export', $.expression, 'as', $.expression, ';')
    ),

    c_code: $ => /[^}%]+/,

    template_stmt: $ => choice(
      $.object_statement_or_typedparam,
      seq('shared', optional($.method_qualifiers), 'method', $.shared_method),
      seq('shared', $.hook_decl)
    ),

    object_spec: $ => choice(
      seq(optional($.object_desc), ';'),
      seq(optional($.object_desc), '{', repeat($.object_statement), '}')
    ),

    object_desc: $ => $.composed_string_literal,

    object_statement: $ => choice(
      $.object_statement_or_typedparam,
      $.bad_shared_method
    ),

    object_statement_or_typedparam: $ => choice(
      $.object,
      $.param,
      $.method,
      seq($.istemplate, ';'),
      $.object_if,
      $.error_stmt,
      $.in_each
    ),

    object_if: $ => seq(
      $.hashif,
      '(',
      $.expression,
      ')',
      '{',
      repeat($.object_statement),
      '}',
      optional($.object_else)
    ),

    object_else: $ => choice(
      seq($.hashelse, '{', repeat($.object_statement), '}'),
      seq($.hashelse, $.object_if)
    ),

    in_each: $ => seq(
      'in',
      'each',
      $.istemplate_list,
      '{',
      repeat($.object_statement),
      '}'
    ),

    // ============================================================
    // Parameters
    // ============================================================

    param: $ => choice(
      seq('param', $.objident, $.paramspec_maybe_empty),
      seq('param', $.objident, 'auto', ';'),
      seq('param', $.objident, ':', $.paramspec),
      seq('param', $.objident, ':', $.ctypedecl, $.paramspec_maybe_empty)
    ),

    paramspec_maybe_empty: $ => choice(
      $.paramspec,
      ';'
    ),

    paramspec: $ => choice(
      seq('=', $.expression, ';'),
      seq('default', $.expression, ';')
    ),

    // ============================================================
    // Templates and Inheritance
    // ============================================================

    istemplate: $ => seq('is', $.istemplate_list),

    istemplate_list: $ => choice(
      $.objident,
      seq('(', $.objident_list, ')')
    ),

    // ============================================================
    // C Declarations
    // ============================================================

    cdecl_or_ident: $ => choice(
      $.named_cdecl,
      seq('inline', $.ident)
    ),

    named_cdecl: $ => $.cdecl,

    cdecl: $ => choice(
      seq($.basetype, optional($.cdecl2)),
      seq('const', $.basetype, optional($.cdecl2))
    ),

    basetype: $ => choice(
      $.typeident,
      $.struct,
      $.layout,
      $.bitfields,
      $.typeof,
      seq('sequence', '(', $.typeident, ')'),
      seq('hook', '(', optional($.cdecl_list_nonempty), ')')
    ),

    cdecl2: $ => choice(
      $.cdecl3,
      seq('const', $.cdecl2),
      seq('*', $.cdecl2),
      seq('vect', $.cdecl2)
    ),

    cdecl3: $ => choice(
      $.ident,
      seq($.cdecl3, '[', $.expression, ']'),
      seq($.cdecl3, '(', optional($.cdecl_list_opt_ellipsis), ')'),
      seq('(', $.cdecl2, ')')
    ),

    cdecl_list_nonempty: $ => prec.left(sep1($.cdecl, ',')),

    cdecl_list_opt_ellipsis: $ => choice(
      $.cdecl_list_nonempty,
      $.cdecl_list_ellipsis
    ),

    cdecl_list_ellipsis: $ => choice(
      '...',
      seq($.cdecl_list_nonempty, ',', '...')
    ),

    cdecl_or_ident_list2: $ => sep1($.cdecl_or_ident, ','),

    // ============================================================
    // Type Declarations
    // ============================================================

    typeof: $ => seq('typeof', $.expression),

    struct: $ => seq(
      'struct',
      '{',
      repeat(seq($.named_cdecl, ';')),
      '}'
    ),

    layout: $ => $.layout_decl,

    layout_decl: $ => seq(
      'layout',
      $.utf8_sconst,
      '{',
      repeat(seq($.named_cdecl, ';')),
      '}'
    ),

    bitfields: $ => seq(
      'bitfields',
      $.integer_literal,
      '{',
      repeat($.bitfields_decl),
      '}'
    ),

    bitfields_decl: $ => seq(
      $.named_cdecl,
      '@',
      '[',
      $.bitfield_range,
      ']',
      ';'
    ),

    bitfield_range: $ => choice(
      $.expression,
      seq($.expression, ':', $.expression)
    ),

    ctypedecl: $ => prec.right(seq(
      optional('const'),
      $.basetype,
      optional($.ctypedecl_ptr)
    )),

    ctypedecl_ptr: $ => prec.right(choice(
      seq(
        repeat1(choice(
          seq('*', optional('const')),
          '*'
        )),
        optional($.ctypedecl_simple)
      ),
      $.ctypedecl_simple
    )),

    ctypedecl_simple: $ => seq('(', optional($.ctypedecl_ptr), ')'),

    typeident: $ => choice(
      $.ident,
      'char',
      'double',
      'float',
      'int',
      'long',
      'short',
      'signed',
      'unsigned',
      'void',
      'register'
    ),


    // ============================================================
    // Expressions
    // ============================================================

    expression: $ => choice(
      // Ternary
      prec.right(30, seq($.expression, '?', $.expression, ':', $.expression)),
      prec.right(30, seq($.expression, '#?', $.expression, '#:', $.expression)),
      
      // Binary operators
      prec.left(120, seq($.expression, '+', $.expression)),
      prec.left(120, seq($.expression, '-', $.expression)),
      prec.left(130, seq($.expression, '*', $.expression)),
      prec.left(130, seq($.expression, '/', $.expression)),
      prec.left(130, seq($.expression, '%', $.expression)),
      prec.left(110, seq($.expression, '<<', $.expression)),
      prec.left(110, seq($.expression, '>>', $.expression)),
      prec.left(90, seq($.expression, '==', $.expression)),
      prec.left(90, seq($.expression, '!=', $.expression)),
      prec.left(100, seq($.expression, '<', $.expression)),
      prec.left(100, seq($.expression, '>', $.expression)),
      prec.left(100, seq($.expression, '<=', $.expression)),
      prec.left(100, seq($.expression, '>=', $.expression)),
      prec.left(40, seq($.expression, '||', $.expression)),
      prec.left(50, seq($.expression, '&&', $.expression)),
      prec.left(60, seq($.expression, '|', $.expression)),
      prec.left(70, seq($.expression, '^', $.expression)),
      prec.left(80, seq($.expression, '&', $.expression)),
      
      // Unary operators
      prec.right(140, seq('cast', '(', $.expression, ',', $.ctypedecl, ')')),
      prec.right(150, seq('sizeof', $.expression)),
      prec.right(150, seq('-', $.expression)),
      prec.right(150, seq('+', $.expression)),
      prec.right(150, seq('!', $.expression)),
      prec.right(150, seq('~', $.expression)),
      prec.right(150, seq('&', $.expression)),
      prec.right(150, seq('*', $.expression)),
      prec.right(150, seq('defined', $.expression)),
      prec.right(150, seq('stringify', '(', $.expression, ')')),
      prec.right(150, seq('++', $.expression)),
      prec.right(150, seq('--', $.expression)),
      prec.left(160, seq($.expression, '++')),
      prec.left(160, seq($.expression, '--')),
      
      // Function calls
      prec.left(160, seq($.expression, '(', ')')),
      prec.left(160, seq($.expression, '(', $.single_initializer_list, ')')),
      prec.left(160, seq($.expression, '(', $.single_initializer_list, ',', ')')),
      
      // Literals
      $.integer_literal,
      $.hex_literal,
      $.binary_literal,
      $.char_literal,
      $.float_literal,
      $.string_literal,
      
      // Special
      'undefined',
      $.objident,
      'default',
      'this',
      
      // Member access
      prec.left(160, seq($.expression, '.', $.objident)),
      prec.left(160, seq($.expression, '->', $.objident)),
      
      // Sizeof type
      prec.right(150, seq('sizeoftype', $.ctypedecl)),
      
      // New
      prec.right(150, seq('new', $.ctypedecl)),
      prec.right(150, seq('new', $.ctypedecl, '[', $.expression, ']')),
      
      // Parenthesized
      seq('(', $.expression, ')'),
      
      // Array literal
      seq('[', sep($.expression, ','), ']'),
      
      // Array/bit access
      prec.left(160, seq($.expression, '[', $.expression, ']')),
      prec.left(160, seq($.expression, '[', $.expression, ',', $.identifier, ']')),
      prec.left(160, seq($.expression, '[', $.expression, ':', $.expression, optional($.endianflag), ']')),
      
      // Each
      seq('each', $.objident, 'in', '(', $.expression, ')')
    ),

    endianflag: $ => seq(',', $.identifier),

    composed_string_literal: $ => prec.left(seq(
      $.utf8_sconst,
      repeat(seq('+', $.utf8_sconst))
    )),

    bracketed_string_literal: $ => choice(
      $.composed_string_literal,
      seq('(', $.composed_string_literal, ')')
    ),

    // ============================================================
    // Initializers
    // ============================================================

    single_initializer: $ => choice(
      $.expression,
      seq('{', $.single_initializer_list, '}'),
      seq('{', $.single_initializer_list, ',', '}'),
      seq('{', $.designated_struct_initializer_list, '}'),
      seq('{', $.designated_struct_initializer_list, ',', '}'),
      seq('{', $.designated_struct_initializer_list, ',', '...', '}')
    ),

    initializer: $ => choice(
      $.single_initializer,
      seq('(', $.single_initializer, ',', $.single_initializer_list, ')')
    ),

    single_initializer_list: $ => prec.left(sep1($.single_initializer, ',')),

    designated_struct_initializer: $ => seq(
      '.',
      $.ident,
      '=',
      $.single_initializer
    ),

    designated_struct_initializer_list: $ => prec.left(sep1($.designated_struct_initializer, ',')),

    // ============================================================
    // Statements
    // ============================================================

    statement: $ => choice(
      $.statement_except_hashif,
      prec.right(seq('#if', '(', $.expression, ')', $.statement)),
      prec.right(seq('#if', '(', $.expression, ')', $.statement, '#else', $.statement))
    ),

    statement_except_hashif: $ => choice(
      $.compound_statement,
      seq($.local, ';'),
      seq($.assign_stmt, ';'),
      seq($.assignop, ';'),
      ';',
      seq($.expression, ';'),
      prec.right(seq('if', '(', $.expression, ')', $.statement)),
      prec.right(seq('if', '(', $.expression, ')', $.statement, 'else', $.statement)),
      seq('while', '(', $.expression, ')', $.statement),
      seq('do', $.statement, 'while', '(', $.expression, ')', ';'),
      seq('for', '(', optional($.for_pre), ';', optional($.expression), ';', optional($.for_post_nonempty), ')', $.statement),
      seq('switch', '(', $.expression, ')', '{', repeat($.stmt_or_case), '}'),
      seq('delete', $.expression, ';'),
      seq('try', $.statement, 'catch', $.statement),
      seq('after', $.expression, $.identifier, ':', $.expression, ';'),
      prec(1, seq('after', $.expression, '->', '(', sep($.ident, ','), ')', ':', $.expression, ';')),
      prec(1, seq('after', $.expression, '->', $.ident, ':', $.expression, ';')),
      seq('after', $.expression, ':', $.expression, ';'),
      seq('after', ':', $.expression, ';'),
      seq('assert', $.expression, ';'),
      seq('log', $.log_kind, ',', $.log_level, ',', $.expression, ':', $.bracketed_string_literal, repeat(seq(',', $.expression)), ';'),
      seq('log', $.log_kind, ',', $.log_level, ':', $.bracketed_string_literal, repeat(seq(',', $.expression)), ';'),
      seq('log', $.log_kind, ':', $.bracketed_string_literal, repeat(seq(',', $.expression)), ';'),
      seq('#select', $.ident, 'in', '(', $.expression, ')', 'where', '(', $.expression, ')', $.statement, $.hashelse, $.statement),
      seq('foreach', $.ident, 'in', '(', $.expression, ')', $.statement),
      seq('#foreach', $.ident, 'in', '(', $.expression, ')', $.statement),
      $.case_statement,
      seq('goto', $.ident, ';'),
      seq('break', ';'),
      seq('continue', ';'),
      seq('throw', ';'),
      seq('return', ';'),
      seq('return', $.initializer, ';'),
      $.error_stmt,
      $.warning_stmt
    ),

    assignop: $ => choice(
      seq($.expression, '+=', $.expression),
      seq($.expression, '-=', $.expression),
      seq($.expression, '*=', $.expression),
      seq($.expression, '/=', $.expression),
      seq($.expression, '%=', $.expression),
      seq($.expression, '|=', $.expression),
      seq($.expression, '&=', $.expression),
      seq($.expression, '^=', $.expression),
      seq($.expression, '<<=', $.expression),
      seq($.expression, '>>=', $.expression)
    ),

    assign_stmt: $ => choice(
      $.assign_chain,
      seq($.tuple_literal, '=', $.initializer)
    ),

    assign_chain: $ => choice(
      seq($.expression, '=', $.assign_chain),
      seq($.expression, '=', $.initializer)
    ),

    tuple_literal: $ => seq(
      '(',
      $.expression,
      ',',
      sep1($.expression, ','),
      ')'
    ),

    compound_statement: $ => seq('{', repeat($.statement), '}'),

    for_pre: $ => choice(
      $.local,
      $.for_post_nonempty
    ),

    for_post_nonempty: $ => sep1($.for_post_one, ','),

    for_post_one: $ => choice(
      $.assign_stmt,
      $.assignop,
      $.expression
    ),

    stmt_or_case: $ => choice(
      $.statement_except_hashif,
      $.cond_case_statement,
      $.case_statement
    ),

    cond_case_statement: $ => choice(
      seq('#if', '(', $.expression, ')', '{', repeat($.stmt_or_case), '}'),
      seq('#if', '(', $.expression, ')', '{', repeat($.stmt_or_case), '}', '#else', '{', repeat($.stmt_or_case), '}')
    ),

    case_statement: $ => choice(
      seq('case', $.expression, ':'),
      seq('default', ':')
    ),

    log_kind: $ => choice(
      $.identifier,
      'error'
    ),

    log_level: $ => choice(
      seq($.expression, 'then', $.expression),
      $.expression
    ),

    error_stmt: $ => choice(
      seq('error', ';'),
      seq('error', $.bracketed_string_literal, ';')
    ),

    warning_stmt: $ => seq('_warning', $.bracketed_string_literal, ';'),

    // ============================================================
    // Local Declarations
    // ============================================================

    local: $ => prec(1, choice(
      seq($.local_decl_kind, $.cdecl),
      seq('saved', $.cdecl),
      seq($.local_decl_kind, $.cdecl, '=', $.initializer),
      seq('saved', $.cdecl, '=', $.initializer),
      seq($.local_decl_kind, '(', $.cdecl_list_nonempty, ')'),
      seq('saved', '(', $.cdecl_list_nonempty, ')'),
      seq($.local_decl_kind, '(', $.cdecl_list_nonempty, ')', '=', $.initializer),
      seq('saved', '(', $.cdecl_list_nonempty, ')', '=', $.initializer)
    )),

    local_decl_kind: $ => choice(
      'local',
      'session'
    ),

    // ============================================================
    // Identifiers and Lists
    // ============================================================

    objident_list: $ => sep1($.objident, ','),

    objident: $ => choice(
      $.ident,
      'register'
    ),

    ident: $ => choice(
      'attribute',
      'bank',
      'bitorder',
      'connect',
      'constant',
      'data',
      'device',
      'event',
      'field',
      'footer',
      'group',
      'header',
      'implement',
      'import',
      'interface',
      'loggroup',
      'method',
      'port',
      'size',
      'subdevice',
      'nothrow',
      'then',
      'throws',
      '_header',
      'provisional',
      'param',
      'saved',
      'independent',
      'startup',
      'memoized',
      $.identifier,
      'class',
      'enum',
      'namespace',
      'private',
      'protected',
      'public',
      'restrict',
      'union',
      'using',
      'virtual',
      'volatile',
      'call',
      'auto',
      'static',
      'select',
      'async',
      'await',
      'with'
    ),

    hashif: $ => choice('#if', 'if'),
    hashelse: $ => choice('#else', 'else'),

    // ============================================================
    // Literals
    // ============================================================

    integer_literal: $ => /[0-9]+/,
    hex_literal: $ => /0[xX][0-9a-fA-F]+/,
    binary_literal: $ => /0[bB][01]+/,
    float_literal: $ => /[0-9]+\.[0-9]+([eE][+-]?[0-9]+)?/,
    char_literal: $ => /'([^'\\]|\\.)'/,
    string_literal: $ => /"([^"\\]|\\.)*"/,
    utf8_sconst: $ => $.string_literal,

    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    // ============================================================
    // Comments
    // ============================================================

    comment: $ => choice(
      seq('//', /.*/),
      seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')
    ),
  }
});

// Helper functions
function sep(rule, separator) {
  return optional(sep1(rule, separator));
}

function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}
