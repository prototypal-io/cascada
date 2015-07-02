const inspect = require('util').inspect;
const css = require('../parse-css');

module.exports.tok = tok;
module.exports.ws = ws;
module.exports.comma = comma;

module.exports.number = number;
module.exports.ident = ident;
module.exports.func = func;

function tok(source) {
  return {
    type: 'Token',
    source: source
  }
};

function number(value) {
  return {
    type: 'Number',
    value: value,
    source: value,
  }
};

function ident(name) {
  return {
    type: 'Ident',
    name: name,
    source: name
  };
};

function func(name, args) {
  return {
    type: 'Function',
    name: name,
    args: args
  };
};

function ws() {
  return tok(' ');
};

function comma() {
  return tok(',');
};
