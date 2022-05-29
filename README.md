# Git Query Toolkit

This toolkit provides you a quick and easy way to extract metadata from git-based repositories.  
Tools:

- Git history parser.
- Query tool.
- The Git Plugin.
- Command line interface.

## Get Started

## How to use it

1. Install [node.js v14.x](https://nodejs.dev/download/)
2. Install the toolkit via npm: `npm i https://github.com/imdonix/git-qtk --global`
3. Check: `git-qtk -h`
4. Create a script file: `nano test.yaml`
``` yaml
from: commit c
select: c.sha
```
5. Run `git-qtk -s .\test.yaml -r https://github.com/imdonix/example`

## Developement

1. Install [node.js v14.x](https://nodejs.dev/download/)
2. Clone: `git clone https://github.com/imdonix/git-qtk`
3. Change directory: `cd git-qtk`
4. Install dependecies: `npm i`
5. Use: `node .\bin\main.js -h`

* Example queries can be found under: `./examples`

## Testing

### Unit tests
Unit tests are implemented with the mocha framework:  
`npm test`

### Runtime measurement
The runtime measurement will run multiple scripts on multiple repositories.  
`npm run runtime` -> `./gen/[CPU name].csv`
