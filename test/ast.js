var assert = require('assert');
var parse = require('../packages/cascada').parse;

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
      value: 'red'
    });
  });
});
