export const WILDCARD = {
  ANY: "$",
  SEP: ";",
  NL: "\n",
  SP: "__",
};

export const OPERATOR = {
  LESS: (a, b) => a < b,
  MORE: (a, b) => a > b,
};

export const LOG = {
  VOID: {
    log: (message) => {},
  },
  STD: {
    log: (message) => console.log(message),
  },
};

export function wrapFunc(body, params) {
  try {
    return new Function(...params, `return ${body}`);
  } catch (err) {
    throw new Error(`Syntax error in script file: ${err.message}`);
  }
}
