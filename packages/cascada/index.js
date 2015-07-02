// var inspect = require('util').inspect;
var css = require('../parse-css');

module.exports.types = require('./types');

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
    case 'AT-RULE':        return acceptAtRule(node);
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
    case 'AT-RULE':     return acceptAtRule(node);
    default: throw new Error("Unknown style declaration type: " + node.type);
  }
}

function acceptStylePropertyDeclaration(node) {
  return {
    type: 'StylePropertyDeclaration',
    important: node.important,
    name: node.name,
    values: acceptComponentValues(node.value)
  };
}

function acceptComponentValues(parts) {
  return trimWhitespaceTokens(parts).map(acceptComponentValue);
}

function acceptComponentValue(node) {
  switch (node.tokenType) {
    case 'WHITESPACE': return acceptToken(node);
    case 'DELIM':      return acceptToken(node);
    case ',':          return acceptToken(node);
    case 'IDENT':      return acceptIdent(node);
    case 'HASH':       return acceptHash(node);
    case 'STRING':     return acceptString(node);
    case 'NUMBER':     return acceptNumber(node);
    case 'DIMENSION':  return acceptDimension(node);
    case 'PERCENTAGE': return acceptPercentage(node);
  }

  switch (node.type) {
    // case 'integer':    return acceptInteger(node);
    case 'FUNCTION':   return acceptFunction(node);
  }

  throw new Error("Unknown component value: <" + node.tokenType + ", " + node.type + ">");
}

function acceptToken(node) {
  return {
    type: "Token",
    source: node.toSource()
  };
}

function acceptIdent(node) {
  return {
    type: "Ident",
    name: node.value,
    source: node.toSource()
  };
}

function acceptHash(node) {
  return {
    type: "Hash",
    value: node.value,
    source: node.toSource()
  };
}

function acceptString(node) {
  return {
    type: "String",
    value: node.value,
    source: node.toSource()
  };
}

function acceptNumber(node) {
  return {
    type: "Number",
    value: node.value,
    source: node.toSource()
  };
}

function acceptDimension(node) {
  return {
    type: "Dimension",
    value: node.value,
    unit: node.unit,
    source: node.toSource()
  };
}

function acceptPercentage(node) {
  return {
    type: "Percentage",
    value: node.value,
    source: node.toSource()
  };
}

function acceptFunction(node) {
  return {
    type: "Function",
    name: node.name,
    args: acceptComponentValues(node.value)
  };
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

function acceptComponentValueParts(name, parts) {
  return parts.map(acceptComponentValuePart);
}

function acceptComponentValuePart(node) {
  if (node.tokenType) {
    return node;
  }

  switch (node.type) {
    case 'FUNCTION': return acceptFunction(node);
    default: throw new Error("Unknown style part: " + node.tokenType + " " + node.type + " " + node)
  }
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