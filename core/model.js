const { abs } = require('./utils')


class Model
{
    name() { abs() }

    model() { abs() }

    key(){ abs() }

    parse(input) { abs() }

    has(field)
    {
        return this.model().hasOwnProperty(field)
    }
}

module.exports = Model