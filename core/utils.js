function getRepoFromURL(url)
{
    return url.substring(url.lastIndexOf('/')+1)
}


module.exports = { getRepoFromURL }