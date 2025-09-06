/*
Reductor functions which can be accessed from script language
*/

export function count(acc, obj)
{
    if(acc == null)
    {
        acc = 0
    }

    return acc + 1
}

export function sum(acc, obj)
{
    if(acc == null)
    {
        acc = 0
    }

    return acc + obj
}

export function min(acc, obj)
{
    if(acc == null)
    {
        acc = obj
    }

    return acc > obj ? obj : acc
}

export function max(acc, obj)
{
    if(acc == null)
    {
        acc = obj
    }

    return acc < obj ? obj : acc
}