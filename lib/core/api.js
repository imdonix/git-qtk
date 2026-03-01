/*
Simplified API via child_process to access and parse Git command line
*/

import { spawn, exec } from "child_process";
import readline from "readline";

export function gitVersion(query) {
  return new Promise((res, rej) => {
    exec("git -v", (err, stdout, stderr) => {
      // Check that the process could be opened
      if (err) {
        rej(err.message);
      }

      // Check if we have error on stderr
      if (stderr) {
        rej(stderr);
      }

      // Return version
      res(stdout.replaceAll("\n", ""));
    });
  });
}

export function gitOpen(path) {
  return new Promise((res, rej) => {
    exec(
      `git rev-parse --is-inside-work-tree -C "${path}"`,
      (err, stdout, stderr) => {
        // Check that the process could be opened
        if (err) {
          rej(err.message);
          return;
        }

        // Check if we have error on stderr
        if (stderr) {
          rej(stderr);
          return;
        }

        const lines = stdout.split("\n");
        if (lines.length == 0) {
          rej(`Unexpected result from 'git rev-parse' (${stdout})`);
          return;
        }

        if (lines[0].trim() != "true") {
          rej(`Repository not found (${stdout})`);
          return;
        }

        res(path);
      },
    );
  });
}

function parsePerson(line) {
  const prefixMatch = line.match(/^(Author|Commit):\s+/);
  if (!prefixMatch) throw new Error("Invalid person line: " + line);

  const rest = line.substring(prefixMatch[0].length);
  const emailMatch = rest.match(/<([^>]*)>$/);
  if (emailMatch) {
    const email = emailMatch[1];
    const name = rest.substring(0, emailMatch.index).trim();
    return { name, email };
  }

  throw new Error("Invalid person line: " + line);
}

function parseDate(line) {
  return line.replace(/^(AuthorDate|CommitDate):\s+/, "").trim();
}

export function gitFetch(repo, commitHandler) {
  const git = spawn("git", ["log", "--all", "--pretty=fuller", "--name-only"], {
    cwd: repo,
  });

  const rl = readline.createInterface({
    input: git.stdout,
    terminal: false,
  });

  return new Promise((res, rej) => {
    let currentCommit = null;
    let state = "IDLE";

    const finalizeCommit = () => {
      if (currentCommit) {
        currentCommit.message = currentCommit.message.join("\n");
        commitHandler(currentCommit);
        currentCommit = null;
      }
    };

    rl.on("line", (line) => {
      if (line.startsWith("commit ")) {
        finalizeCommit();
        currentCommit = {
          hash: line.substring(7).trim(),
          message: [],
          files: [],
        };
        state = "METADATA";
        return;
      }

      if (!currentCommit) return;

      switch (state) {
        case "METADATA":
          if (line.startsWith("Merge: ")) {
            currentCommit.merge = line.substring(7).trim();
          } else if (line.startsWith("Author: ")) {
            currentCommit.author = parsePerson(line);
          } else if (line.startsWith("AuthorDate: ")) {
            currentCommit.authorDate = parseDate(line);
          } else if (line.startsWith("Commit: ")) {
            currentCommit.committer = parsePerson(line);
          } else if (line.startsWith("CommitDate: ")) {
            currentCommit.commitDate = parseDate(line);
          } else if (line.trim() === "") {
            state = "MESSAGE";
          }
          break;

        case "MESSAGE":
          if (line.startsWith("    ")) {
            currentCommit.message.push(line.substring(4));
          } else if (line.trim() === "") {
            if (currentCommit.merge) {
              finalizeCommit();
              state = "IDLE";
            } else {
              state = "FILES";
            }
          }
          break;

        case "FILES":
          if (line.trim() === "") {
            finalizeCommit();
            state = "IDLE";
          } else {
            currentCommit.files.push(line.trim());
          }
          break;
      }
    });

    git.on("close", (code) => {
      finalizeCommit();
      if (code === 0) {
        res();
      } else {
        rej(`Git log failed with error code '${code}'`);
      }
    });
  });
}
