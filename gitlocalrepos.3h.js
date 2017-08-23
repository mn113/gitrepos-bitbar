#!/usr/bin/env /Users/martin/.nvm/versions/node/v8.4.0/bin/node

/*
 * <bitbar.title>Git Local Repos</bitbar.title>
 * <bitbar.version>v0.2</bitbar.version>
 * <bitbar.author>M. Nicholson</bitbar.author>
 * <bitbar.author.github>mn113</bitbar.author.github>
 * <bitbar.image>http://i.imgur.com/...</bitbar.image>TODO screenshot
 * <bitbar.desc>List local git repos and their statuses</bitbar.desc>
 * <bitbar.dependencies>node,nodegit</bitbar.dependencies>
 */

// find all local git repos (under a certain folder) - OK
// exclude unwanted - OK
// get last commit (modified?) date - OK
// get total commits
// clean/dirty?
// remote status?
// display in list - OK

const path = require('path');
const exec = require('child_process').exec;
const Git = require('nodegit');

// User config:
const basedir = '~/Dropbox/htdocs';	// set your own basedir as desired
const excludes = [/\.bower/, /Library\//, /node_modules/, /phonecat/];	// list of regexes of paths to exclude
const numberOfRepos = 10;						// change if you want
const GET_REPOS_CMD = "find " + basedir + " -name .git";	// only change if you know what you're doing

const GITICON =
"iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAB+ElEQVQ4T43Tz2pTURAG8G/mpCD4AlVcKdhuNBHpQpNAciMq4qI+gaC0CuLCha7EQgsuXIgIVbBQ0DcQQRDEGzBFELTtShci+BfENzC588m5aW7T5OakZ3XgnvmdmTlzBWNWsdI4LOBLM1iBdu7ju+aXUIiEPnqM6MQKt3/r3E9NrB5Cg2Cp3LgH4c2BS4NoLnj8RG06cXwq0HmCC4Be2C06BHqsoxqLYBKwP2Y45QR7oLKXia1C3cFQ+TvAo+X6lECaXay7BLy43oqf+X2pGs2BeNKX7VD5GZiH+UCSi5tr8YLfH6tG10k8DJWfgh4jNXbKfYOvbmaJqM4B8pfC345yl+CZUaj40TBDMw/bDuKyAAWCszCchbgiYG2ILAI41N9TKVWizwCmwvPdA+UKxB5svG3e8OeLJ6PToniV9dv4Q45Ua+8ddWbXILCy0Xozn4KVxnkBX/RiDfgkM7Xa5L+OxgJMj0a3M/Q9VXH3Ifhl6NzK/iJLvjqdqKePEkINaIvIJQELlmBFFYWhi7ewD63X37OxGYUKeWd9LV5Kx6YSLRG4vQPsw7pz27fyUIKXN1vxagqWo6sUPM5CBrAhMK98A76p8JpRVIFHAA6kYA6WC47raQgbCQbREZllsxiav6GejsGCGfYu8mi7w+egm3Cis340Qkn8B2ZrG9Schh6FAAAAAElFTkSuQmCC";

// Set icon:
console.log("| dropdown=false templateImage='"+GITICON+"'");	// TODO: icon
console.log("---");

// Prepare data containers:
var allRepoPaths = [];
var allRepos = [];

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
    //console.warn(allRepoPaths);

	allRepos = allRepoPaths.map(analyseRepo);	// array of Promises

	// Wait until everything is retrieved & processed:
	Promise.all(allRepos).then(readyRepos => output(readyRepos));
});

// Using nodegit, open up each repo and save its key details to an object:
// Function should return a Promise of the reduced repo object
function analyseRepo(repo_path) {
	var repo = {
		fullpath: repo_path,
		parentpath: repo_path.substring(0,repo_path.lastIndexOf(path.sep)),
	};
	repo.dir = path.basename(repo.parentpath);

	return Git.Repository.open(repo_path)	// Promise
	.then(function(repository) {
		// Extract repo info:
		repo.status = Object.keys(repository.getStatus()).join(', ');	// TODO
		repo.remotes = Object.keys(repository.getRemotes()).join(', ');	// TODO
		repo.branch = repository.getCurrentBranch().name;				// BUG: undefined
		repo.totalCommits = 0;	// TODO
		// Move on to last commit:
		return repository.getHeadCommit();	// Promise
	})
	.then(function(commit) {
		// Extract last commit info:
		repo.lastCommitDate = commit.date();
		repo.lastCommitMessage = commit.message().replace(/(-|\s)+/g, ' ');	// strip dashes & newlines
		repo.lastCommitAuthor = commit.author().name();
		// By this point repository & commit Promises have resolved
		// Return the repo in a Promise:
		return Promise.resolve(repo);
	})
	.catch(function(error) {
		console.error(error);
	});
}

// Show most recent ones first:
function sortRecent(repos) {
	return repos.sort(function(a,b) {
		return b.lastCommitTime - a.lastCommitTime;
	});
}

// Output:
function output(displayRepos) {
	console.log("Local git repos: | templateImage='" + GITICON + "'");
	//console.log("AR", displayRepos[0]);
	console.log("---");
	displayRepos.slice(0, numberOfRepos).forEach(function(repo) {
		//repo = Promise.resolve(repo);
		// Format display for menubar:
		console.log(repo.dir, "| font=LucidaGrande-Bold color=black");
		console.log("Status:", repo.status, "| size=11 color=#999999");
		console.log("Last commit:", repo.lastCommitDate, "| size=11 color=#999999");
		console.log("--msg:", repo.lastCommitMessage);
		console.log("--on", repo.branch);
		console.log("--by", repo.lastCommitAuthor);
		console.log("--"+repo.totalCommits, "total commits");
		console.log("--Show repo in Finder | bash=open param1="+repo.parentpath+" terminal=true");
	});
	console.log("---");
	console.log("Options");
	console.log("--Set your base folder, excludes and repo limit in the script");
	console.log("--Open script file | bash='${EDITOR:-nano}' param1="+__filename);
	console.log("--Reload plugin | refresh=true terminal=false");
}
