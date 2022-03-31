function getRepoFromURL(url)
{
    return url.substring(url.lastIndexOf('/')+1)
}

function abs()
{
    throw new Error("Abstract method");
}

function emptyLogger()
{
    return {
        log : () => {}
    }
}

const WILDCARD_ANY = '$'

module.exports = { getRepoFromURL, abs, emptyLogger, WILDCARD_ANY }