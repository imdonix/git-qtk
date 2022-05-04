const { abs } = require('./utils')


class Model
{
    //name of the model
    name() { abs() }

    //the model definition as a name-type object 
    model() { abs() }

    //the unique key of the model
    key(){ abs() }

    //the processor which creates the actual database object
    parse(input) { abs() }

    has(field)
    {
        return this.model().hasOwnProperty(field)
    }
}

module.exports = Model