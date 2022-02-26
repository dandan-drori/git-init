#!/usr/bin/env node

const { access, readFile, writeFile } = require('fs/promises');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

function help() {
  console.log(`
The script reads version control repositories urls from a file.
For each url, a git clone is performed.
if a clone already exists - a git pull is performed.
Provided arguments are cached in ~/.git_init_settings file.

Usage:
  Expects 0 - 2 arguments.
  First expected argument is file path to read repos urls from.
  Second expected argument is directory path to clone repos to.

  No arguments:
    If a ~/.git_init_settings file exists, saved settings are used,
    otherwise the file to read repos urls from is './my.list'.
    and the directory to save repos to is the current directory.
  `);
  process.exit(1);
}

function isWindowsOS() {
  return process.platform === 'win32';
}

async function saveSettings(args, user) {
  const settingsFilePath = isWindowsOS() ? `C:\\Users\\${user}\\.git_init_settings` : `/Users/${user}/.git_init_settings`;
  try {
    const raw = await readFile(settingsFilePath);
    const settings = raw.toString().split('\n').filter(f => f);
    if (!args.length) return settings;
    if (settings.length < args.length) return;

    let match = true;
    args.forEach((arg, idx) => {
      if (arg !== settings[idx]) {
        match = false;
      }
    })
    if (!match) await writeFile(settingsFilePath, args.join('\n'));
  } catch (e) {
      const argsToSave = args.length ? args.join('\n') : './my.list\n.';
      await writeFile(settingsFilePath, argsToSave);
  }
}

async function parseArgs(user) {
  const args = process.argv.slice(2);
  if (args.includes('-h')) help();
  const newArgs = await saveSettings(args, user);
  return (newArgs && Array.isArray(newArgs) && newArgs.length) ? newArgs : args;
}

async function getReposUrls(reposUrlsFilePath) {
  const fgRed = '\x1b[31m';
  const reset = '\x1b[0m';
  const file = await readFile(reposUrlsFilePath).catch(e => {
    console.log(`${fgRed}Error:${reset} file ${reposUrlsFilePath} doesn't exists.`)
    process.exit(1);
  });
  return file.toString().split('\n').filter(f => f);
}

async function createGitDir(user, saveDirPath) {
  const homePath = isWindowsOS() ? `C:\\Users\\${user}\\` : `Users/${user}/`;
  const pathWithoutTilde = saveDirPath.includes('~') ? `${homePath}${saveDirPath.substring(2)}` : saveDirPath;
  await access(pathWithoutTilde).catch(async e => {
    const path = saveDirPath === '.' ? 'current directory' : saveDirPath
    const dirPath = path.includes(`/Users/${user}`) ? path.replace(`/Users/${user}`, '~') : path;
    console.log(`Creating a new directory at ${dirPath}...`);
    if (saveDirPath !== '.') await exec(`mkdir -p ${saveDirPath}`);
  });
}

async function getUser() {
  const fgRed = '\x1b[31m';
  const reset = '\x1b[0m';
  const {stdout} = await exec('whoami').catch(e => {
    console.log(`${fgRed}Error:${reset} command 'whoami' not found.`);
    process.exit(1);
  });
  return stdout.trim();
}

function getRepoName(repoUrl) {
  const lastSlashIndex = repoUrl.lastIndexOf('/');
  const lastPeriodIndex = repoUrl.lastIndexOf('.');
  return repoUrl.substring(lastSlashIndex + 1, lastPeriodIndex);
}

async function cloneIfNotExists(user, name, repoUrl, saveReposDirPath) {
  const homePath = isWindowsOS() ? `C:\\Users\\${user}\\` : `Users/${user}/`;
  const dirName = saveReposDirPath === '.' ? 'current directory' : saveReposDirPath;
  const pathWithoutTilde = saveReposDirPath.includes('~') ? `${homePath}${saveReposDirPath.substring(2)}` : saveReposDirPath;
  await access(`${pathWithoutTilde}/${name}`).catch(async e => {
    const dirPath = dirName.includes(`/Users/${user}`) ? dirName.replace(`/Users/${user}`, '~') : dirName;
    console.log(`Cloning ${name} into ${dirPath}...`);
    const slash = isWindowsOS() ? `\\` : '/';
    const res = await exec(`git clone ${repoUrl} ${saveReposDirPath}${slash}${name}`);
    throw new Error('Cloning process successful');
  });
}

async function pullIfExists(name, saveReposDirPath, user) {
  const dirName = saveReposDirPath === '.' ? 'current directory' : saveReposDirPath;
  const dirPath = dirName.includes(`/Users/${user}`) ? dirName.replace(`/Users/${user}`, '~') : dirName;
  console.log(`Updating ${name} in ${dirPath}...`);
  const slash = isWindowsOS() ? `\\` : '/';
  const {stdout} = await exec(`git -C ${saveReposDirPath}${slash}${name} pull`);
  return stdout;
}

function suggestAction(saveReposDirPath, user) {
  if (saveReposDirPath === '.') return;
  const fgCyan = '\x1b[36m';
  const reset = '\x1b[0m';
  const dirPath = saveReposDirPath.includes(`/Users/${user}`) ? saveReposDirPath.replace(`/Users/${user}`, '~') : saveReposDirPath;
  console.log(`\n${fgCyan}  cd ${dirPath}${reset}\n`);
}

;(async () => {
  const user = await getUser();
  const [reposUrlsFilePath = './my.list', saveReposDirPath = '.'] = await parseArgs(user);
  const content = await getReposUrls(reposUrlsFilePath);
  await createGitDir(user, saveReposDirPath);
  const prms = content.map(async (repoUrl) => {
    const name = getRepoName(repoUrl);
    try {
      await cloneIfNotExists(user, name, repoUrl, saveReposDirPath);
      await pullIfExists(name, saveReposDirPath, user);
    } catch (e) {
    } finally {
      return new Promise((resolve) => resolve())
    }
  });
  await Promise.all(prms);
  suggestAction(saveReposDirPath, user);
})();

