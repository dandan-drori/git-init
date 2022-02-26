# Intro

The script reads version control repositories urls from a file,
for each url, a `git clone` is performed.  
If a clone already exists - a `git pull` is performed instead.

The following command will create a file named 'my.list' with repositories urls:  

\* Don't forget to replace \<author\> and \<repo\_name\> with the actual values.  

```
echo 'http://github.com/<author>/<repo_name>\nhttp://github.com/<author>/<repo_name>' > ./my.list
```

## Usage:
  - Expects 0 - 2 arguments.
  - First expected argument is file path to read repos urls from.
  - Second expected argument is directory path to clone repos to.

### No arguments:
  - Attempts to read and use cached settings from '~/.git\_init\_settings'.
  - default file to read repos urls from is './my.list'.
  - default directory to save repos to is the current directory.

#### To be able to run the script from any directory, add the following line to your ~/.bashrc or ~/.zshrc:

```
alias git-init="/path/to/script/index.js"
```
