class Plugin
{
    models(){ new Error("Abstract") }

    parse(commit) { new Error("Abstract") }
}

module.exports = Plugin