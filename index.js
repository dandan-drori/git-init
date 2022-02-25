#!/usr/bin/env node

const { access, readFile } = require('fs/promises');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

function help() {
  console.log(`
The script reads version control repositories urls from a file.
For each url, if a clone already exists - a git pull is performed.
If a clone doesn't exist - a git clone is performed.

Usage:
  Expects 0 - 2 arguments.
  First expected argument is file path to read repos urls from.
  Second expected argument is directory path to clone repos to.

  No arguments:
    File to read repos urls from is './my.list'.
    Directory to save repos to is '~/git'.
  `);
  process.exit(1);
}

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.includes('-h')) help();
  return args;
}

async function getReposUrls(reposUrlsFilePath = './my.list') {
  const fgRed = '\x1b[31m';
  const reset = '\x1b[0m';
  const file = await readFile(reposUrlsFilePath).catch(e => {
    console.log(`${fgRed}Error:${reset} file ${reposUrlsFilePath} doesn't exists.`)
    process.exit(1);
  });
  return file.toString().split('\n').filter(f => f);
}

async function createGitDir(user, saveDirPath = '~/git') {
  const pathWithoutTilde = saveDirPath.includes('~') ? saveDirPath.substring(2) : saveDirPath;
  await access(`/Users/${user}/${pathWithoutTilde}`).catch(async e => {
    console.log(`Creating a new directory at ${saveDirPath}...`);
    await exec(`mkdir -p ${saveDirPath}`);
  });
}

async function getUser() {
  const fgRed = '\x1b[31m';
  const reset = '\x1b[0m';
  const {stdout} = await exec('whoami').catch(e => {
    console.log(`${fgRed}Error:${reset} command 'whoami' not found. This is script is for Unix based systems only`);
    process.exit(1);
  });
  return stdout.trim();
}

function getRepoName(repoUrl) {
  const lastSlashIndex = repoUrl.lastIndexOf('/');
  const lastPeriodIndex = repoUrl.lastIndexOf('.');
  return repoUrl.substring(lastSlashIndex + 1, lastPeriodIndex);
}

async function cloneIfNotExists(user, name, repoUrl, saveReposFilePath = '~/git') {
  const pathWithoutTilde = saveReposFilePath.includes('~') ? `/Users/${user}/${saveReposFilePath.substring(2)}` : saveReposFilePath;
  await access(`${pathWithoutTilde}/${name}`).catch(async e => {
    console.log(`Cloning ${name} into ${saveReposFilePath}...`);
    const res = await exec(`git clone ${repoUrl} ${saveReposFilePath}/${name}`);
    throw new Error('Cloning process successful');
  });
}

async function pullIfExists(name, saveReposFilePath = '~/git') {
  console.log(`Updating ${name} in ${saveReposFilePath}...`);
  const {stdout} = await exec(`git -C ${saveReposFilePath}/${name} pull`);
  return stdout;
}

function suggestAction(saveReposFilePath = '~/git') {
  const fgCyan = '\x1b[36m';
  const reset = '\x1b[0m';
  console.log(`\n${fgCyan}  cd ${saveReposFilePath}${reset}\n`);
}

;(async () => {
  const [reposUrlsFilePath, saveReposFilePath] = parseArgs();
  const content = await getReposUrls(reposUrlsFilePath);
  const user = await getUser();
  await createGitDir(user, saveReposFilePath);
  const prms = content.map(async (repoUrl) => {
    const name = getRepoName(repoUrl);
    try {
      await cloneIfNotExists(user, name, repoUrl, saveReposFilePath);
      await pullIfExists(name, saveReposFilePath);
    } catch (e) {
    } finally {
      return new Promise((resolve) => resolve())
    }
  });
  await Promise.all(prms);
  suggestAction(saveReposFilePath);
})();

