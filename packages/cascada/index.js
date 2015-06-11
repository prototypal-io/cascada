const inspect = require('util').inspect;
const css = require('../parse-css');

module.exports.parse = function parse(source) {
  return acceptStylesheet(
    css.parseAStylesheet(source)
  );
};

function acceptStylesheet(node) {
  return {
    type: 'StyleSheet',
    rules: acceptRules(node.value)
  };
}

function acceptRules(nodes) {
  return nodes.map(acceptRule);
}

function acceptRule(node) {
  switch (node.type) {
    case 'QUALIFIED-RULE': return acceptStyleRule(node);
    case 'AT-RULE': return acceptAtRule(node);
    default: throw new Error("Unknown rule type: " + node.type);
  }
}

function acceptStyleRule(node) {
  return {
    type: 'StyleRule',
    selectors: [ acceptSelector(node.prelude) ],
    body: acceptDeclarations(node.value.value, acceptStyleDeclaration)
  }
}

function acceptSelector(tokens) {
  return tokens.map(function(token) {
    return token.toSource();
  }).join('').trimRight();
}

function acceptDeclarations(tokens, acceptor) {
  var nodes = css.consumeAListOfDeclarations(
    new css.TokenStream(tokens)
  );

  return nodes.map(function(node) {
    return acceptor(node);
  });
}

function acceptStyleDeclaration(node) {
  switch (node.type) {
    case 'DECLARATION': return acceptStylePropertyDeclaration(node);
    case 'AT-RULE': return acceptAtRule(node);
    default: throw new Error("Unknown style declaration type: " + node.type);
  }
}

function acceptStylePropertyDeclaration(node) {
  return {
    type: 'StylePropertyDeclaration',
    important: node.important,
    name: node.name,
    value: acceptContextualValue(node.name, node.value)
  };
}

function acceptContextualValue(name, parts) {
  parts = trimWhitespaceTokens(parts);

  if (name[0] === '-' && name[1] === '-') {
    return acceptCustomPropertyValue(name, parts);
  } else {
    return acceptStyleValue(name, parts);
  }
}

function acceptCustomPropertyValue(name, parts) {
  if (parts[0].type === 'BLOCK') {
    return acceptMixin(parts);
  } else {
    return acceptStyleValue(name, parts);
  }
}

function acceptMixin(parts) {
  var block = parts[0];

  return {
    type: 'Mixin',
    body: acceptDeclarations(block.value, acceptMixinStyleDeclaration)
  };
}

function acceptStyleValue(name, parts) {
  return printValue(parts);
}

function printValue(parts) {
  return parts.map(function(part) {
    if (part.tokenType) {
      return part.toSource();
    } else if (part.type === 'FUNCTION') {
      return part.name + '(' + printValue(part.value) + ')';
    } else {
      throw new Error("Unsupported value part: " + JSON.stringify(part.toJSON()));
    }
  }).join('');
}

function acceptStyleValueParts(name, parts) {
  return parts.map(acceptStyleValuePart);
}

function acceptStyleValuePart(node) {
  if (node.tokenType) {
    return node;
  }

  switch (node.type) {
    case 'FUNCTION': return acceptFunction(node);
    default: throw new Error("Unknown style part: " + node.tokenType + " " + node.type + " " + node)
  }
}

function acceptFunction(node) {
  throw new Error("Functions in property values (e.g. calc and color) are not yet supported.");
}

function acceptMixinStyleDeclaration(node) {
  switch (node.type) {
    case 'DECLARATION': return acceptStylePropertyDeclaration(node);
    default: throw new Error("Unknown style declaration type: " + node.type);
  }
}


function acceptAtRule(node) {
  return {
    type: 'AtRule',
    name: node.name,
    prelude: node.prelude,
    value: node.value
  };
}

function trimWhitespaceTokens(tokens) {
  var startIndex = 0;
  var endIndex = tokens.length;

  while (tokens[startIndex].tokenType === 'WHITESPACE') { startIndex++; }
  while (tokens[endIndex-1].tokenType === 'WHITESPACE') { endIndex--; }

  return tokens.slice(startIndex, endIndex);
}