function getRepoFromURL(url)
{
    return url.substring(url.lastIndexOf('/')+1)
}

function abs()
{
    throw new Error("Abstract method");
}

module.exports = { getRepoFromURL, abs }