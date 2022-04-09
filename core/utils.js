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

module.exports = { getRepoFromURL, abs, LOG, WILDCARD }