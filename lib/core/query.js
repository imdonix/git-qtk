import fs from "fs";
import os from "os";
import path from "path";
import yaml from "yaml";

import { Git, Author, Commit, File } from "./git.js";
import { Database } from "./database.js";

import { runner } from "./runner.js";
import { post } from "./post.js";
import { gitVersion, gitOpen, gitFetch } from "./api.js";
import { LOG } from "./utils.js";
import {
  parseRepository,
  parseFrom,
  parseSelect,
  parseWhere,
  parseLimit,
  parseOrder,
  parseGroup,
  parseJoin,
} from "./parse.js";

import { trim, short, has } from "./functions.js";
import { count, max, min, sum } from "./reductors.js";

import builtin from "./builtin.js";

export const params = {
  script: {
    type: "string",
    description:
      "Name of the script. List builtins by -b or defined your own in ~/.qit-qtk/<script>.yaml",
    keys: ["s", "script"],
    required: true,
    or: ["yaml"],
  },
};

export class Query {
  constructor(input) {
    if (!input) {
      throw new Error("Input script has not been passed!");
    }

    this.logger = input.verbose ? LOG.STD : LOG.VOID;

    this.tracker = new Object();

    this.models = [Author, Commit, File];
    this.functions = { trim, short, has };
    this.reductors = { count, max, min, sum };

    this.db = new Database(this.models);
    this.plugin = new Git();
    this.plugin.init(this.db);

    this.query = input;

    this.validate();
  }

  async track(fun) {
    let start = Date.now();
    let res = await fun.bind(this)();
    let time = Math.ceil((Date.now() - start) / 1000);
    this.tracker[fun.name] = time;
    return res;
  }

  async load() {
    /* Fetch builtin script if found */
    for (const bs of Object.values(builtin)) {
      if (bs.name === this.query.script) {
        this.yaml = JSON.parse(JSON.stringify(bs));
        break;
      }
    }

    /* Script is builtin */
    if (this.yaml) {
      parseRepository(this);
    } else if (this.query.script) {
      /* Script is not builtin, load from home folder */
      this.yaml = this.openQuery();
      parseRepository(this);
    } else {
      throw new Error("Query is invalid without a script.");
    }

    await this.track(this.openRepository);
    await this.track(this.fetch);
    await this.track(this.post);

    return this.tracker;
  }

  async run(script) {
    if (script) {
      this.query.script = script;
      this.yaml = this.openQuery();
    }

    parseFrom(this);
    parseSelect(this);
    parseJoin(this);
    parseWhere(this);
    parseLimit(this);
    parseOrder(this);
    parseGroup(this);

    await this.track(runner);
    return await this.track(post);
  }

  openQuery() {
    const home = os.homedir();
    const scriptPath = path.join(home, ".qit-qtk", "script.yaml");

    try {
      fs.accessSync(scriptPath, fs.R_OK);
      const file = fs.readFileSync(scriptPath, "utf8");
      const allScripts = yaml.parse(file);

      if (allScripts && allScripts[this.query.script]) {
        const script = allScripts[this.query.script];
        script.name = this.query.script;
        return script;
      }
      throw new Error(
        `The script [${this.query.script}] not found in ${scriptPath}`,
      );
    } catch (err) {
      throw new Error(
        `The script file could not be opened! [${scriptPath}] ${err.message}`,
      );
    }
  }

  async openRepository() {
    const path = ".";

    const version = await gitVersion();

    this.logger.log(`[${version}]`);

    try {
      this.repo = await gitOpen(path);
    } catch (err) {
      throw new Error(`Repository not found! ${err}`);
    }
  }

  async fetch() {
    let visited = 0;

    await gitFetch(this.repo, (commit) => {
      visited++;
      this.plugin.parse(this.db, commit);
    });

    this.tracker["commits"] = visited;
    this.logger.log(`[Parser] ${visited} commits have been parsed.`);


    return visited;
  }

  async post() {
    this.plugin.post(this.db);
    this.db.finalize();
  }

  validate() {
    let problems = [];

    for (const par in params) {
      if (params[par].required) {
        if (!(par in this.query) && params[par].or.length == 0) {
          problems.push(par);
        }
      }
    }

    if (problems.length > 0) {
      let prettify = problems
        .map((par) => params[par].keys.map((key) => `-${key}`).join(" or "))
        .join(" and ");
      throw new Error(`Missing required parameters: ${prettify}`);
    }
  }

  findModel(name) {
    let i = this.models.findIndex((model) => model.name() == name);
    if (i >= 0) {
      return this.models[i];
    } else {
      throw new Error(`No model exist with the name of '${name}'`);
    }
  }

  view() {
    return this.db;
  }
}
