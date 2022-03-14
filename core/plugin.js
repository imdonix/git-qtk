class Plugin
{
    models(){ new Error("Abstract") }

    parse(db, commit) { new Error("Abstract") }
}

module.exports = Plugin