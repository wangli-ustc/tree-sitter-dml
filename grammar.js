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

  extras: $ => [/\s/, $.comment, $.line_comment],

  word: $ => $.identifier,

  conflicts: $ => [
    [$.hashif, $.compound_statement],
    [$.device_statement, $.statement],
    [$.session, $.local_declaration],
    [$.saved, $.local_declaration],
    [$.cdecl, $.cdecl_declarator],
  ],

  rules: {
    source_file: $ => seq(
      'dml',
      field('version', $.version),
      ';',
      optional($.provisional),
      optional($.device_declaration),
      optional($.bitorder_declaration),
      repeat($.device_statement)
    ),

    version: $ => /\d+\.\d+/,

    provisional: $ => seq('provisional', $.identifier_list, ';'),

    device_declaration: $ => seq('device', $.identifier, ';'),

    bitorder_declaration: $ => seq('bitorder', choice('be', 'le'), ';'),

    device_statement: $ => choice(
      $.toplevel,
      $.object,
      $.param,
      $.method,
      seq($.is_template, ';'),
      $.hashif,
      $.in_each
    ),

    toplevel: $ => choice(
      $.import_statement,
      $.template,
      $.header,
      $.footer,
      $.loggroup,
      $.constant,
      $.extern,
      $.typedef,
      $.export
    ),

    import_statement: $ => seq('import', $.string_literal, ';'),

    template: $ => seq(
      'template',
      field('name', $.identifier),
      optional($.is_template),
      '{',
      repeat($.template_statement),
      '}'
    ),

    template_statement: $ => choice(
      $.object,
      $.param,
      $.method,
      seq($.is_template, ';'),
      $.hashif,
      $.shared_method,
      $.shared_hook
    ),

    shared_method: $ => seq(
      'shared',
      repeat($.method_qualifier),
      'method',
      field('name', $.identifier),
      $.method_params,
      choice(
        ';',
        seq('default', $.compound_statement),
        $.compound_statement
      )
    ),

    shared_hook: $ => seq('shared', $.hook_declaration),

    header: $ => seq(choice('header', '_header'), $.c_block),

    footer: $ => seq('footer', $.c_block),

    loggroup: $ => seq('loggroup', $.identifier, ';'),

    constant: $ => seq('constant', $.identifier, '=', $.expression, ';'),

    extern: $ => seq('extern', $.cdecl, ';'),

    typedef: $ => seq(choice('typedef', seq('extern', 'typedef')), $.cdecl, ';'),

    export: $ => seq('export', $.expression, 'as', $.expression, ';'),

    object: $ => choice(
      $.bank,
      $.register,
      $.field,
      $.session,
      $.saved,
      $.connect,
      $.interface,
      $.attribute,
      $.event,
      $.group,
      $.port,
      $.implement,
      $.subdevice,
      $.hook_declaration
    ),

    bank: $ => seq('bank', $.identifier, repeat($.array_spec), optional($.is_template), $.object_spec),

    register: $ => seq(
      'register',
      $.identifier,
      repeat($.array_spec),
      optional($.size_spec),
      optional($.offset_spec),
      optional($.is_template),
      $.object_spec
    ),

    field: $ => seq(
      'field',
      $.identifier,
      repeat($.array_spec),
      optional($.bitrange),
      optional($.is_template),
      $.object_spec
    ),

    session: $ => seq('session', choice($.cdecl, seq('(', $.cdecl_list, ')')), optional(seq('=', $.initializer)), ';'),

    saved: $ => seq('saved', choice($.cdecl, seq('(', $.cdecl_list, ')')), optional(seq('=', $.initializer)), ';'),

    connect: $ => seq('connect', $.identifier, repeat($.array_spec), optional($.is_template), $.object_spec),
    interface: $ => seq('interface', $.identifier, repeat($.array_spec), optional($.is_template), $.object_spec),
    attribute: $ => seq('attribute', $.identifier, repeat($.array_spec), optional($.is_template), $.object_spec),
    event: $ => seq('event', $.identifier, repeat($.array_spec), optional($.is_template), $.object_spec),
    group: $ => seq('group', $.identifier, repeat($.array_spec), optional($.is_template), $.object_spec),
    port: $ => seq('port', $.identifier, repeat($.array_spec), optional($.is_template), $.object_spec),
    implement: $ => seq('implement', $.identifier, repeat($.array_spec), optional($.is_template), $.object_spec),
    subdevice: $ => seq('subdevice', $.identifier, repeat($.array_spec), optional($.is_template), $.object_spec),

    hook_declaration: $ => seq('hook', '(', $.cdecl_list, ')', $.identifier, repeat(seq('[', $.expression, ']')), ';'),

    array_spec: $ => seq('[', $.identifier, '<', choice($.expression, '...'), ']'),

    size_spec: $ => seq('size', $.expression),

    offset_spec: $ => seq('@', $.expression),

    bitrange: $ => seq('@', '[', $.expression, optional(seq(':', $.expression)), ']'),

    object_spec: $ => choice(
      seq(optional($.description), ';'),
      seq(optional($.description), '{', repeat($.object_statement), '}')
    ),

    description: $ => $.string_literal,

    object_statement: $ => choice(
      $.object,
      $.param,
      $.method,
      seq($.is_template, ';'),
      $.hashif,
      $.in_each
    ),

    param: $ => seq(
      'param',
      $.identifier,
      choice(
        seq(':', $.type_specifier, optional($.param_spec)),
        seq(':', $.param_spec),
        $.param_spec,
        seq('auto', ';')
      )
    ),

    param_spec: $ => choice(
      seq('=', $.expression, ';'),
      seq('default', $.expression, ';'),
      ';'
    ),

    method_qualifier: $ => choice('independent', 'startup', 'memoized'),

    method: $ => seq(
      repeat($.method_qualifier),
      'method',
      field('name', $.identifier),
      $.method_params,
      optional('default'),
      $.compound_statement
    ),

    method_params: $ => seq(
      '(',
      optional($.cdecl_list),
      ')',
      optional(seq('->', '(', $.cdecl_list, ')')),
      optional('throws')
    ),

    is_template: $ => seq('is', choice($.objident, seq('(', $.objident_list, ')'))),

    objident: $ => choice($.identifier, 'register'),

    objident_list: $ => commaSep1($.objident),

    in_each: $ => seq('in', 'each', choice($.identifier, seq('(', $.identifier_list, ')')), '{', repeat($.object_statement), '}'),

    hashif: $ => prec.right(seq(
      '#if',
      '(',
      $.expression,
      ')',
      choice(
        $.statement,
        seq('{', repeat($.device_statement), '}')
      ),
      optional(seq('#else', choice($.statement, seq('{', repeat($.device_statement), '}'))))
    )),

    cdecl: $ => seq(
      repeat('const'),
      $.type_specifier,
      optional($.cdecl_declarator)
    ),

    cdecl_declarator: $ => choice(
      seq(
        repeat1(choice('*', 'const', 'vect')),
        optional($.identifier),
        repeat(choice(
          seq('[', optional($.expression), ']'),
          seq('(', optional($.cdecl_list), ')')
        ))
      ),
      seq(
        optional($.identifier),
        repeat1(choice(
          seq('[', optional($.expression), ']'),
          seq('(', optional($.cdecl_list), ')')
        ))
      ),
      $.identifier,
      prec(1, seq(
        repeat(choice('*', 'const', 'vect')),
        '(',
        repeat(choice('*', 'const', 'vect')),
        $.identifier,
        ')',
        repeat(choice(
          seq('[', optional($.expression), ']'),
          seq('(', optional($.cdecl_list), ')')
        ))
      ))
    ),

    cdecl_list: $ => seq($.cdecl, repeat(seq(',', $.cdecl))),

    type_specifier: $ => choice(
      $.identifier,
      $.struct_specifier,
      $.layout_specifier,
      $.bitfields_specifier,
      $.typeof_specifier,
      $.sequence_type,
      $.hook_type,
      'char', 'double', 'float', 'int', 'long', 'short', 'signed', 'unsigned', 'void'
    ),

    struct_specifier: $ => seq('struct', '{', repeat(seq($.cdecl, ';')), '}'),

    layout_specifier: $ => seq('layout', $.string_literal, '{', repeat(seq($.cdecl, ';')), '}'),

    bitfields_specifier: $ => seq('bitfields', $.integer_literal, '{', repeat($.bitfield_member), '}'),

    bitfield_member: $ => seq($.cdecl, '@', '[', $.expression, optional(seq(':', $.expression)), ']', ';'),

    typeof_specifier: $ => seq('typeof', $.expression),

    sequence_type: $ => seq('sequence', '(', $.identifier, ')'),

    hook_type: $ => seq('hook', '(', $.cdecl_list, ')'),

    statement: $ => choice(
      $.compound_statement,
      $.expression_statement,
      $.if_statement,
      $.while_statement,
      $.do_statement,
      $.for_statement,
      $.switch_statement,
      $.return_statement,
      $.break_statement,
      $.continue_statement,
      $.throw_statement,
      $.try_statement,
      $.log_statement,
      $.assert_statement,
      $.error_statement,
      $.after_statement,
      $.delete_statement,
      $.local_declaration,
      $.hashif,
      $.foreach_statement,
      $.hashforeach_statement,
      $.select_statement,
      $.assignment_statement,
      ';'
    ),

    compound_statement: $ => seq('{', repeat($.statement), '}'),

    expression_statement: $ => seq($.expression, ';'),

    assignment_statement: $ => seq(
      choice(
        seq($.expression, '=', $.initializer),
        seq($.expression, repeat1(seq('=', $.expression)), '=', $.initializer),
        seq('(', $.expression, ',', commaSep1($.expression), ')', '=', $.initializer),
        seq($.expression, choice('+=', '-=', '*=', '/=', '%=', '|=', '&=', '^=', '<<=', '>>='), $.expression)
      ),
      ';'
    ),

    if_statement: $ => prec.right(seq('if', '(', $.expression, ')', $.statement, optional(seq('else', $.statement)))),

    while_statement: $ => seq('while', '(', $.expression, ')', $.statement),

    do_statement: $ => seq('do', $.statement, 'while', '(', $.expression, ')', ';'),

    for_statement: $ => seq(
      'for',
      '(',
      choice($.local_decl_no_semi, commaSep($.for_init)),
      ';',
      optional($.expression),
      ';',
      commaSep($.for_init),
      ')',
      $.statement
    ),

    for_init: $ => choice(
      seq($.expression, '=', $.initializer),
      seq($.expression, choice('+=', '-=', '*=', '/=', '%=', '|=', '&=', '^=', '<<=', '>>='), $.expression),
      $.expression
    ),

    switch_statement: $ => seq('switch', '(', $.expression, ')', '{', repeat(choice($.statement, $.case_statement)), '}'),

    case_statement: $ => choice(
      seq('case', $.expression, ':'),
      seq('default', ':')
    ),

    return_statement: $ => seq('return', optional($.initializer), ';'),

    break_statement: $ => seq('break', ';'),

    continue_statement: $ => seq('continue', ';'),

    throw_statement: $ => seq('throw', ';'),

    try_statement: $ => seq('try', $.statement, 'catch', $.statement),

    log_statement: $ => seq(
      'log',
      $.log_kind,
      optional(seq(',', $.log_level)),
      optional(seq(',', $.expression)),
      ':',
      $.composed_string_literal,
      repeat(seq(',', $.expression)),
      ';'
    ),

    log_kind: $ => $.identifier,

    log_level: $ => prec.left(seq($.expression, optional(seq('then', $.expression)))),

    composed_string_literal: $ => prec.left(seq(
      $.string_literal,
      repeat(seq('+', $.string_literal))
    )),

    assert_statement: $ => seq('assert', $.expression, ';'),

    error_statement: $ => seq('error', optional($.composed_string_literal), ';'),

    after_statement: $ => seq(
      'after',
      $.expression,
      choice(
        seq($.identifier, ':', $.expression),
        seq('->', choice($.identifier, seq('(', $.identifier_list, ')')), ':', $.expression),
        seq(':', $.expression)
      ),
      ';'
    ),

    delete_statement: $ => seq('delete', $.expression, ';'),

    local_declaration: $ => seq(
      choice('local', 'session', 'saved'),
      choice(
        seq($.cdecl, optional(seq('=', $.initializer))),
        seq('(', $.cdecl_list, ')', optional(seq('=', $.initializer)))
      ),
      ';'
    ),

    local_decl_no_semi: $ => seq(
      choice('local', 'session', 'saved'),
      choice(
        seq($.cdecl, optional(seq('=', $.initializer))),
        seq('(', $.cdecl_list, ')', optional(seq('=', $.initializer)))
      )
    ),

    foreach_statement: $ => seq('foreach', $.identifier, 'in', '(', $.expression, ')', $.statement),

    hashforeach_statement: $ => seq('#foreach', $.identifier, 'in', '(', $.expression, ')', $.statement),

    select_statement: $ => seq(
      '#select',
      $.identifier,
      'in',
      '(',
      $.expression,
      ')',
      'where',
      '(',
      $.expression,
      ')',
      $.statement,
      '#else',
      $.statement
    ),

    expression: $ => choice(
      $.primary_expression,
      $.binary_expression,
      $.unary_expression,
      $.conditional_expression,
      $.hash_conditional_expression,
      $.call_expression,
      $.member_expression,
      $.index_expression,
      $.slice_expression,
      $.cast_expression,
      $.new_expression,
      $.sizeof_expression,
      $.sizeoftype_expression,
      $.typeof_expression,
      $.each_in_expression,
      $.stringify_expression
    ),

    primary_expression: $ => choice(
      $.identifier,
      $.integer_literal,
      $.float_literal,
      $.string_literal,
      $.char_literal,
      'undefined',
      'default',
      'this',
      seq('(', $.expression, ')'),
      $.list_literal
    ),

    list_literal: $ => seq('[', commaSep($.expression), ']'),

    binary_expression: $ => choice(
      ...[
        ['||', 40],
        ['&&', 50],
        ['|', 60],
        ['^', 70],
        ['&', 80],
        ['==', 90], ['!=', 90],
        ['<', 100], ['<=', 100], ['>', 100], ['>=', 100],
        ['<<', 110], ['>>', 110],
        ['+', 120], ['-', 120],
        ['*', 130], ['/', 130], ['%', 130]
      ].map(([op, precedence]) => prec.left(precedence, seq($.expression, op, $.expression)))
    ),

    unary_expression: $ => prec.right(150, choice(
      seq(choice('!', '~', '-', '+', '&', '*', '++', '--', 'defined'), $.expression),
      seq($.expression, choice('++', '--'))
    )),

    conditional_expression: $ => prec.right(30, seq($.expression, '?', $.expression, ':', $.expression)),

    hash_conditional_expression: $ => prec.right(30, seq($.expression, '#?', $.expression, '#:', $.expression)),

    call_expression: $ => prec.left(160, seq($.expression, '(', optional(commaSep1($.initializer)), ')')),

    member_expression: $ => prec.left(160, seq($.expression, choice('.', '->'), $.identifier)),

    index_expression: $ => prec.left(160, seq($.expression, '[', $.expression, ']')),

    slice_expression: $ => prec.left(160, seq(
      $.expression,
      '[',
      $.expression,
      choice(
        seq(',', $.identifier),
        seq(':', $.expression, optional(seq(',', $.identifier)))
      ),
      ']'
    )),

    cast_expression: $ => prec(140, seq('cast', '(', $.expression, ',', $.cast_type, ')')),

    cast_type: $ => prec.left(seq(
      repeat('const'),
      $.type_specifier,
      repeat(choice('*', 'const'))
    )),

    new_expression: $ => prec.right(150, seq('new', $.type_specifier, optional(seq('[', $.expression, ']')))),

    sizeof_expression: $ => prec.right(150, seq('sizeof', $.expression)),

    sizeoftype_expression: $ => prec.right(150, seq('sizeoftype', $.cast_type)),

    typeof_expression: $ => seq('typeof', $.expression),

    each_in_expression: $ => seq('each', $.identifier, 'in', '(', $.expression, ')'),

    stringify_expression: $ => seq('stringify', '(', $.expression, ')'),

    initializer: $ => choice(
      $.expression,
      seq('{', commaSep($.initializer), optional(','), '}'),
      seq('{', commaSep1(seq('.', $.identifier, '=', $.initializer)), optional(seq(',', '...')), optional(','), '}'),
      seq('(', $.initializer, ',', commaSep1($.initializer), optional(','), ')')
    ),

    identifier_list: $ => commaSep1($.identifier),

    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    integer_literal: $ => choice(
      /[0-9](?:[0-9_]*[0-9])?/,
      /0x[0-9a-fA-F_]*[0-9a-fA-F]/,
      /0b[01_]*[01]/
    ),

    float_literal: $ => /[0-9]*(\.[0-9]+([eE]-?[0-9]+)?|([eE]-?[0-9]+))/,

    string_literal: $ => /"([^"\\\x00-\x1f\x7f]|\\.)*"/,

    char_literal: $ => /'([^'\\\x00-\x1f\x7f-\xff]|\\.)'/,

    c_block: $ => /%\{[^%]*(%[^}][^%]*)?\%\}/,

    comment: $ => token(seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')),

    line_comment: $ => token(seq('//', /[^\r\n]*/)),
  }
});

function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}
