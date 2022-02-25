# Intro

* The script reads version control repositories urls from a file.
* For each url, if a clone already exists - a git pull is performed.
* If a clone doesn't exist - a git clone is performed.

## Usage:
  - Expects 0 - 2 arguments.
  - First expected argument is file path to read repos urls from.
  - Second expected argument is directory path to clone repos to.

### No arguments:
  - File to read repos urls from is './my.list'.
  - Directory to save repos to is '~/git'.
