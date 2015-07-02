var assert = require('assert');
var cascada = require('../packages/cascada');
var parse = cascada.parse;
var t = cascada.types;

describe("Cascada", function() {
  it("accepts at-rules", function() {
    var ss = parse("@media print {}");
    assert.strictEqual(ss.rules.length, 1);
    assert.strictEqual(ss.rules[0].type, 'AtRule');
    assert.strictEqual(ss.rules[0].name, 'media');
  });

  it("accepts style rules", function() {
    var ss = parse(".foo .bar {}");
    assert.strictEqual(ss.rules.length, 1);
    assert.strictEqual(ss.rules[0].type, 'StyleRule');
    assert.deepEqual(ss.rules[0].selectors, ['.foo .bar']);
  });

  it("accepts declarations in style rules", function() {
    var ss = parse("a { color: red; }");
    assert.strictEqual(ss.rules.length, 1);
    assert.strictEqual(ss.rules[0].type, 'StyleRule');
    assert.deepEqual(ss.rules[0].selectors, ['a']);
    assert.strictEqual(ss.rules[0].body.length, 1);
    assert.deepEqual(ss.rules[0].body[0], {
      type: 'StylePropertyDeclaration',
      important: false,
      name: 'color',
      values: [ t.ident('red') ]
    });
  });

  it("accepts multiple component values in a declaration", function() {
    var ss = parse("a { color: red blue; }");
    assert.strictEqual(ss.rules.length, 1);
    assert.strictEqual(ss.rules[0].type, 'StyleRule');
    assert.deepEqual(ss.rules[0].selectors, ['a']);
    assert.strictEqual(ss.rules[0].body.length, 1);
    assert.deepEqual(ss.rules[0].body[0], {
      type: 'StylePropertyDeclaration',
      important: false,
      name: 'color',
      values: [ t.ident('red'), t.ws(), t.ident('blue') ]
    });
  });

  it("accepts nested function values in style rules", function() {
    var ss = parse("a { color: rgba(255, 123, 17, var(--alpha)); }");
    assert.strictEqual(ss.rules.length, 1);
    assert.strictEqual(ss.rules[0].type, 'StyleRule');
    assert.deepEqual(ss.rules[0].selectors, ['a']);
    assert.strictEqual(ss.rules[0].body.length, 1);
    assert.deepEqual(ss.rules[0].body[0], {
      type: 'StylePropertyDeclaration',
      important: false,
      name: 'color',
      values: [
        t.func('rgba', [
          t.number(255), t.comma(), t.ws(),
          t.number(123), t.comma(), t.ws(),
          t.number(17), t.comma(), t.ws(),
          t.func('var', [ t.ident('--alpha') ]),
        ])
      ]
    });
  });

});
