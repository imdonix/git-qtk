#!/usr/bin/env node

import fs from "fs";
import path from "path";
import url from "url";

import Table from "cli-table3";

import { cli } from "../lib/core/cli.js";
import { Query, params } from "../lib/core/query.js";
import { gitVersion } from "../lib/core/api.js";

import SCRIPTS from "../lib/core/builtin.js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const global = {
  version: {
    type: "bool",
    description: "Version of the git-qtk",
    keys: ["v", "version"],
  },

  help: {
    type: "bool",
    description: "Help",
    keys: ["h", "help"],
  },

  builtin: {
    type: "bool",
    description: "Lists the builtin query scripts",
    keys: ["b", "builtin"],
  },

  verbose: {
    type: "bool",
    description: "Extra logs for debugging",
    keys: ["verbose"],
  },
};

(async () => {
  const merge = { ...global, ...params };
  const input = cli(process.argv, merge);

  if (input.version) version();
  else if (input.builtin) builtin();
  else if (input.script) script(input);
  else help(merge);
})();

async function version() {
  const pck = JSON.parse(
    fs.readFileSync(`${__dirname}/../package.json`, "utf8"),
  );

  try {
    const git = await gitVersion();
    console.log(`git-qtk: v${pck.version} [using ${git}]`);
  } catch (err) {
    console.error(
      `Valid Git executable not found, make sure it's added to PATH (${err})`,
    );
  }
}

async function help(merge) {
  const table = new Table({
    head: ["option", "key(s)", "description"],
  });

  for (const [key, value] of Object.entries(merge)) {
    const realkey = value.keys.map((k) => `-${k}`).join(", ");
    table.push([key, realkey, value.description]);
  }

  console.log(table.toString());
  console.log("Example query: gitq -s hot-files limit=4")
}

async function builtin() {
  const table = new Table({
    head: ["Name", "Descriptions"],
  });

  for (const script of Object.values(SCRIPTS)) {
    table.push([script.name, script.desc]);
  }

  console.log(table.toString());
}

async function script(input) {
  const query = new Query(input);

  try {
    query.validate();

    await query.load();
    const result = await query.run();

    if (input.verbose) {
      console.log(`[Time] Opening : ${query.tracker.openRepository}s`);
      console.log(
        `[Time] Parsing : ${query.tracker.init + query.tracker.fetch + query.tracker.post}s`,
      );
      console.log(`[Time] Query : ${query.tracker.runner}s`);
    }

    if (result.length > 0) {
      const template = result[0];

      const table = new Table({
        head: Object.keys(template),
      });

      for (const rec of result) {
        table.push(Object.values(rec));
      }

      console.log(table.toString());
    } else {
      console.log("The query result is empty!");
    }
  } catch (err) {
    if (err.message) {
      console.error(`Error: ${err.message}`);
    } else {
      console.error(`Something went wrong.`);
      console.trace(err);
    }
  }
}
