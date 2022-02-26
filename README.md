# Intro

* The script reads version control repositories urls from a file.
* For each url, a `git clone` is performed.
* If a clone already exists - a `git pull` is performed instead.

## Usage:
  - Expects 0 - 2 arguments.
  - First expected argument is file path to read repos urls from.
  - Second expected argument is directory path to clone repos to.

### No arguments:
  - Attempts to read and use cached settings from '~/.git\_init\_settings'.
  - default file to read repos urls from is './my.list'.
  - default directory to save repos to is the current directory.
