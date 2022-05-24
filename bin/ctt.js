#! /usr/bin/env node
// Convert CSV into Latex table for runtime

const fs = require('fs').promises
const tablesize = 6*6
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

fs.open(__dirname + '/../measurement.csv')
.then(file => fs.readFile(file))
.then(input => {
    let lines = input.toString().split('\n')
    let sum = new String()

    let str = new String(header)
    let i = 0
    let page = 1

    lines.shift() // remove header
    lines = lines.filter(s => s != '')
    lines.sort(comaprator)
    for (const line of lines) 
    {
        const [device, repo, script, commit, load, run, set] = line.split(';')
        str += `${dev(device)} & ${repon(repo)} & ${script} & ${load} s & ${run} s & ${s(set)} \\\\ \n`
        str += '\\hline\n'
        i++

        if(i > tablesize)
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

    console.log('table.tex content generated')
    return sum
})
.then(out => fs.writeFile(__dirname + '/../table.tex', out))
.catch(err => console.error(err))