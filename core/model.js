class Model
{
    name() { throw new Error("Abstract") }

    model() { throw new Error("Abstract") }

    key(){ throw new Error("Abstract") }

    parse(input) { throw new Error("Abstract") }
}

module.exports = Model