/*
General utility functions which can be accessed from script language
*/

export function short(obj)
{
    if(typeof obj == 'string')
    {
        return obj.substring(0, 6).toUpperCase()
    }
    else if(typeof obj.getMonth === 'function')
    {
        let mm = obj.getMonth() + 1;
        let dd = obj.getDate();

        return [obj.getFullYear(),
                (mm>9 ? '' : '0') + mm,
                (dd>9 ? '' : '0') + dd
                ].join('.');
    }
    else
    {
        return obj
    }
}

export function trim(str)
{
    if(typeof(str) == 'string')
    {
        return str.length
    }

    throw new Error(`'trim' can't be used on '${typeof(str)}'`)
}

export function has(arr, elem)
{
    return arr.indexOf(elem) >= 0
}