function getRepoFromURL(url)
{
    return url.substring(url.lastIndexOf('/')+1).replace('.git', '')
}

function abs()
{
    throw new Error("Abstract method");
}

const LOG = {
    VOID : {
        log: () => {}
    }
}

const WILDCARD = {
    ANY: '$'
}

const OPERATOR = {
    LESS: (a,b) => a < b,
    MORE: (a,b) => a > b,
}

module.exports = { getRepoFromURL, abs, LOG, WILDCARD, OPERATOR }