# Git Query Toolkit (git-qtk)

The Git Query Toolkit (git-qtk) offers a fast and intuitive way to query metadata from Git-based repositories, including commits, authors, and files, using a custom SQL-like [Query Language](#query-language).

## Get Started

### How to use it

1. [Git](https://git-scm.com/downloads) must be installed.
2. Install the toolkit via npm: `npm install https://github.com/imdonix/git-qtk --global`
3. Check that the installation was successful: `git-qtk -v`
4. Create a query script file: `nano jschanges.yaml` (see [Query Language](#query-language) documentation below).
``` yaml
# How many times a file in the 'bin/' directory with a '.js' extension has been changed.
from: file f; commit c
select: f.path; count(c.sha)
where: c.changes.indexOf(f.path) >= 0 && f.path.indexOf('.js') >= 0 && f.path.substring(0,4) === 'bin/'
group: f.path
```
5. Run `git-qtk -s .\jschanges.yaml -r https://github.com/imdonix/git-qtk`
``` bash
>> git-qtk -s .\jschanges.yaml -r https://github.com/imdonix/git-qtk 
[git version 2.45.0.windows.1]
[Open] Repository './git-qtk' found!
[Parser] 311 commit are parsed
[Runner] Join with: P2(f) -> f | [init -> 39]
[Runner] Filtering: P3(f) => f.path.substring(0,4) === 'bin/' | [39 -> 3]
[Runner] Join with: -> c | [3 -> 933]
[Runner] Filtering: P1(f, c) => c.changes.indexOf(f.path) >= 0 | [933 -> 61]
[Time] <1s
┌────────────────┬──────────────┐
│ f.path         │ count(c.sha) │
├────────────────┼──────────────┤
│ bin/main.js    │ 23           │
├────────────────┼──────────────┤
│ bin/ctt.js     │ 12           │
├────────────────┼──────────────┤
│ bin/runtime.js │ 26           │
└────────────────┴──────────────┘
>>
```

## Query Language

This query language provides a declarative way to search through data models using YAML syntax. It allows you to specify which models to include, what fields to select, how to filter and order the results, and more. The toolkit optimizes the query by selecting only the necessary plugins based on the models specified in the `from` tag.

Queries are defined in YAML files using the following tags:

- `from`: Specifies which models to include.
- `select`: Specifies which fields or expressions to include in the result.
- `where`: (Optional) Filters the records based on a condition.
- `limit`: (Optional) Limits the number of records returned.
- `order`: (Optional) Specifies the sorting order.
- `group`: (Optional) Groups records by a specified field.

Below is a detailed explanation of each tag.

### From

The `from` tag is **required** and specifies which data models to include in your query.

#### Rules

- Select a model by its name.
- Separate multiple models with a semicolon (`;`).
- To include the same model multiple times, assign a unique nickname after the model name.

#### Examples

```yaml
from: commit
from: commit; author
from: commit a; commit c
```

#### Invalid Examples

- Omitting the `from` tag.
- Including multiple models with the same name without nicknames, e.g., `from: commit; commit`.
- Using the same nickname for different models, e.g., `from: commit c; author c`.

### Select

The `select` tag is **required** and specifies which fields or expressions to include in the query result.

#### Rules

- Use the syntax `model.field` to select a specific field.
- Separate multiple selections with a semicolon (`;`).
- Use the `$` symbol to select all fields.
- Include JavaScript expressions that will be evaluated.

#### Examples

```yaml
select: $
select: $; "Dr. " + author.name
select: 1 + 2; 44; short(commit.sha)
```

**Note**: Expressions are evaluated as JavaScript, allowing for operations and function calls.

### Where

The `where` tag is **optional** and allows you to filter the records based on a JavaScript condition.

#### Rules

- Provide a single JavaScript statement.
- Reference fields using `model.field`.
- When using the `group` tag, you can use aggregate functions (reducers) like `sum()`, `count()`, `min()`, and `max()` to filter groups.

#### Examples

```yaml
where: author.email == commit.author && true
where: author.data > (now() - 1000)
```

#### Special Case: Joins

If the condition includes `model1.field == model2.field` and one of the fields is a key, it is treated as a join operation for performance optimization. This sub-statement is removed from the `where` tag and handled separately.

### Limit

The `limit` tag is **optional** and specifies the maximum number of records to return.

#### Rules

- Provide a positive integer.

#### Examples

```yaml
limit: 1
limit: 30
```

#### Invalid Examples

- `limit: 0`
- `limit: -1`

### Order

The `order` tag is **optional** and specifies how to sort the records.

#### Rules

- Provide a field to sort by, followed by `ASC` for ascending or `DESC` for descending order.
- Use the syntax `model.field ORDER`, where ORDER is `ASC` or `DESC`.

#### Examples

```yaml
order: commit.date DESC
order: commit.author ASC
```

### Group

The `group` tag is **optional** and groups records that have the same value in the specified field.

#### Rules

- Provide a single field using `model.field`.

When using `group`, you can use aggregate functions in the `where` tag to filter the grouped results, such as `sum()`, `count()`, `min()`, and `max()`.

#### Examples

```yaml
group: commit.author
```

### Full Example

Here is a complete query example that selects the SHA and author name for the last 10 commits, joining commits and authors on the author ID:

```yaml
from: commit; author
select: commit.sha; author.name
where: commit.author == author.id
order: commit.date DESC
limit: 10
```

**Note**: The toolkit enhances performance by creating a subset of required plugins based on the models specified in the `from` tag.

## Testing

### Unit tests
Unit tests are implemented with the mocha framework:  
`npm test`

### Runtime measurement
The runtime measurement will run multiple scripts on multiple repositories.  
`npm run runtime` -> `./gen/[CPU name].csv`