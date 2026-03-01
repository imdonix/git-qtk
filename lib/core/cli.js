/*
CLI parsing utilities
*/

const processors = {
  string: inputProcessor,
  bool: toggleProcessor,
};

export function cli(args, params) {
  const query = new Object();
  query.params = new Object();
  query.args = new Array();

  let shifted = args.slice(2);

  while (shifted.length > 0) {
    let key = shifted.shift();

    const variable = key.split("=");
    if (variable.length == 2) {
      const [k, v] = variable;
      if (k && v) {
        query.params[k] = v;
      }
    } else if (key.startsWith("-")) {
      let par = findParam(key.substring(1), params);
      if (par) {
        let type = params[par].type;
        processors[type](query, par, shifted);
      }
    } else {
      query.args.push(key);
    }
  }

  return query;
}

function findParam(key, params) {
  for (const par in params) {
    if (params[par].keys.includes(key)) {
      return par;
    }
  }

  return null;
}

function inputProcessor(query, param, args) {
  if (args.length > 0) {
    let val = args.shift();
    query[param] = val;
  } else {
    console.error(`You must give a value for the '${param}' parameter`);
  }
}

function toggleProcessor(query, param, args) {
  query[param] = true;
}
