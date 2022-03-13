class Author
{
    constructor(signature)
    {
        this.email = signature.email()
        this.name = signature.name()
    }

    key()
    {
        return this.email
    }

}

module.exports = Author;