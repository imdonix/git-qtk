#! /usr/bin/env node
// Convert runtime CSVs into Latex table for thesis

const fs = require('fs').promises
const rows = 40

const header = `\\begin{table}[H]
\\centering
\\begin{tabular}{ | m{0.15\\textwidth} | m{0.16\\textwidth} | m{0.25\\textwidth} | m{0.1\\textwidth} | m{0.1\\textwidth} | m{0.1\\textwidth} | }
\\hline
\\textbf{Device} & \\textbf{Repository} & \\textbf{Script} & \\textbf{Parsing} & \\textbf{Query} & \\textbf{Size} \\\\ 
\\hline \\hline
`
const devices = {
    '5500U' : 'Laptop',
    'E5-2689' : 'Workstation',
    '8370C' : 'Action'
}

function comaprator(al, bl)
{
    const a = al.split(';')
    const b = bl.split(';')

    const nameA = a[1].toLowerCase()
    const nameB = b[1].toLowerCase();

    const devA = a[2].toLowerCase()
    const devB = b[2].toLowerCase();

    if(nameA == nameB)
    {
        if(devA < devB)
        {
            return -1
        }
        else
        {
            return 1
        }
    }
    else
    {
        if(nameA < nameB)
        {
            return -1
        }
        else
        {
            return 1
        }
    }
}

function repon(url)
{
    return url.split('/')[4]
}

function dev(dev)
{
    for (const [key, value] of Object.entries(devices)) 
    {
        if(dev.indexOf(key) >= 0)
        {
            return value
        }        
    }

    return 'Unknown'
}

function s(num)
{
    if(num < 1000)
    {
        return '< 1k'
    }
    else
    {
        return `~${Math.round(num/1000)}k`
    }
}

fs.readdir(`${__dirname}/../gen`)
.then(files => files.filter(file => file.indexOf('.csv') >= 0))
.then(files => Promise.all(files.map(file => fs.readFile(`{__dirname}/../gen/${file}`)))) 
.then(contents => 
{
    const sum = new Array()
    
    for(const content of contents)
    {
        const lines = input.toString().split('\n')
        lines.shift() // remove header
        for (const l of lines) 
        {
            sum.push(l)
        }
    }
    return sum
})
.then(lines => {
    
    let sum = new String()

    let str = new String(header)
    let i = 0
    let page = 1

    
    lines = lines.filter(s => s != '')
    lines.sort(comaprator)
    for (const line of lines) 
    {
        const [device, repo, script, commit, load, run, set] = line.split(';')
        str += `${dev(device)} & ${repon(repo)} & ${script} & ${load} s & ${run} s & ${s(set)} \\\\ \n`
        str += '\\hline\n'
        i++

        if(i > rows)
        {
            str += `\\end{tabular}
            \\caption{Runtime measurement - Page ${page++}.}
            \\label{tab:mes-${page}}
            \\end{table}\n
            `
            i = 0
            sum += str
            str = new String(header)
        }
    }

    str += `\\end{tabular}
    \\caption{Runtime measurement - Page ${page++}.}
    \\label{tab:mes-${page}}
    \\end{table}\n
    `
    sum += str

    console.log('gen/table.texgen generated')
    return sum
})
.then(out => fs.writeFile(__dirname + '/../gen/table.tex', out))
.catch(err => console.error(err))