const Git = require('nodegit')
const fs = require('fs')

Git.Repository.open('./CodeCompass')
.then(repo => repo.getMasterCommit())
.then(commit => commit.getDiff())
.then(diffs => {
    for (const dif of diffs) 
    {
        for (let i = 0; i < dif.numDeltas(); i++) {
            let delta = dif.getDelta(i)
            console.log(delta.oldFile().path())
        }    
    }
})