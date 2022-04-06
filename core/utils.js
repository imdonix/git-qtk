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

function repalceAll(str, from, to)
{
    let prev;
    do
    {
        prev = str
        str = str.replace(from, to)
    }
    while(prev != str)

    return str
}

const WILDCARD_ANY = '$'

module.exports = { repalceAll, getRepoFromURL, abs, emptyLogger, WILDCARD_ANY }