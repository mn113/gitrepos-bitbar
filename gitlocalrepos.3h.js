#!/usr/bin/env /Users/martin/.nvm/versions/node/v8.4.0/bin/node

/*
 * <bitbar.title>Git Local Repos</bitbar.title>
 * <bitbar.version>v0.2</bitbar.version>
 * <bitbar.author>M. Nicholson</bitbar.author>
 * <bitbar.author.github>mn113</bitbar.author.github>
 * <bitbar.image>http://i.imgur.com/...</bitbar.image>
 * <bitbar.desc>List local git repos and their statuses</bitbar.desc>
 * <bitbar.dependencies>node,nodegit</bitbar.dependencies>
 */

// find all local git repos (under a certain folder) - OK
// exclude unwanted - OK
// get last commit (modified?) date - OK
// get total commits
// clean/dirty?
// remote status?
// display in list

const path = require('path');
const exec = require('child_process').exec;
const Git = require('nodegit');

// User config:
const basedir = '~/Dropbox/Python/pythoncode';				// set your own basedir as desired
const excludes = [/^\.bower/, /Library\//];		// list of regexes of paths to exclude
const GET_REPOS_CMD = "find " + basedir + " -name .git";

// Prepare containers:
var allRepoPaths = [];
var allRepos = [];

// Set icon:
console.log("ⓖ");	// TODO: icon
console.log("---");

// Run a shell command to find all the .git directories:
exec(GET_REPOS_CMD, (error, stdout, stderr) => {
    if (error) {
        console.error('stderr', stderr);
        throw error;
    }
	allRepoPaths = stdout.split(/\n/)
	.filter(str => str.length > 0)
	// Apply excludes:
	.filter(str => {
		return excludes.every(exc => {
			return str.search(exc) === -1;
		});
	});
    console.warn(allRepoPaths);

	allRepos = allRepoPaths.map(analyseRepo);	// array of Promises

	// Wait until everything is retrieved & processed:
	Promise.all(allRepos).then(output);
});

// Using nodegit, open up each repo and save its key details to an object:
// Function should return a Promise of the reduced repo object
function analyseRepo(repo_path) {
	var repo = {
		fullpath: repo_path,
		dir: path.basename(repo_path.substring(0,repo_path.lastIndexOf(path.sep)))
	};

	return Git.Repository.open(repo_path)
	.then(function(repository) {
		// Extract repo info:
		repo.status = Object.keys(repository.getStatus()).join(', ');
		repo.remotes = Object.keys(repository.getRemotes()).join(', ');
		repo.branch = repository.getCurrentBranch().name;		// BUG: undefined
		repo.totalCommits = 0;
		// Move on to last commit:
		return repository.getHeadCommit();	// Promise
	})
	.then(function(commit) {
		// Extract last commit info:
		repo.lastCommitDate = commit.date();
		repo.lastCommitMessage = commit.message();
		repo.lastCommitAuthor = commit.author().name();
		return Promise.resolve(repo);
	});
	//.done(function() {
	//});
}

// Show most recent ones first:
function sortRecent(repos) {
	return repos.sort(function(a,b) {
		return b.lastCommitTime - a.lastCommitTime;
	});
}

// Output:
function output() {
	console.log("Local git repos: | templateImage='" + GITICON + "'");
	console.log("AR", allRepos);
	allRepos.forEach(function(repo) {
		// Format display for menubar:
		console.log(repo.dir, "| font=LucidaGrande-Bold");
		console.log("Status:", repo.status);
		console.log("Last commit:", repo.lastCommitDate, "| size=12 color=#999");
		console.log("--"+repo.lastCommitMessage);
		console.log("--"+repo.branch);
		console.log("--"+repo.author);
		console.log("--"+repo.totalCommits, "total commits");
		console.log("--Open in iTerm");	// TODO
	});
	console.log("---");
	console.log("Options");
	console.log("--Set your base folder, excludes and repo limit in the script");
	console.log("--Open script file | bash='${EDITOR:-nano}' param1="+__filename);
	console.log("--Reload plugin | refresh=true terminal=false");
}

//data:image/png;base64,
const GITICON =
"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAB+ElEQVQ4T43Tz2pTURAG8G/mpCD4AlVcKdhuNBHpQpNAciMq4qI+gaC0CuLCha7EQgsuXIgIVbBQ0DcQQRDEGzBFELTtShci+BfENzC588m5aW7T5OakZ3XgnvmdmTlzBWNWsdI4LOBLM1iBdu7ju+aXUIiEPnqM6MQKt3/r3E9NrB5Cg2Cp3LgH4c2BS4NoLnj8RG06cXwq0HmCC4Be2C06BHqsoxqLYBKwP2Y45QR7oLKXia1C3cFQ+TvAo+X6lECaXay7BLy43oqf+X2pGs2BeNKX7VD5GZiH+UCSi5tr8YLfH6tG10k8DJWfgh4jNXbKfYOvbmaJqM4B8pfC345yl+CZUaj40TBDMw/bDuKyAAWCszCchbgiYG2ILAI41N9TKVWizwCmwvPdA+UKxB5svG3e8OeLJ6PToniV9dv4Q45Ua+8ddWbXILCy0Xozn4KVxnkBX/RiDfgkM7Xa5L+OxgJMj0a3M/Q9VXH3Ifhl6NzK/iJLvjqdqKePEkINaIvIJQELlmBFFYWhi7ewD63X37OxGYUKeWd9LV5Kx6YSLRG4vQPsw7pz27fyUIKXN1vxagqWo6sUPM5CBrAhMK98A76p8JpRVIFHAA6kYA6WC47raQgbCQbREZllsxiav6GejsGCGfYu8mi7w+egm3Cis340Qkn8B2ZrG9Schh6FAAAAAElFTkSuQmCC"
