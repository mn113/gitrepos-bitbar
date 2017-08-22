#!/usr/bin/env /Users/martin/.nvm/versions/node/v7.1.0/bin/node

const fs = require('fs');
const path = require('path');
const Git = require('nodegit');

const basedir = '~/Dropbox/Python';
const GET_REPOS_CMD = "find " + basedir + " -name .git";

var excludes = ["^\.", "Library\/"];

// Run a shell command to find all the .git directories:
allRepoPaths = [];
const exec = require('child_process').exec;
const child = exec(GET_REPOS_CMD, (error, stdout, stderr) => {
    if (error) {
        console.error('stderr', stderr);
        throw error;
    }
	allRepoPaths = stdout.split(/\n/).filter(str => str.length > 0);
    console.log(allRepoPaths);

	console.log("Local git repos:");
	allRepoPaths.forEach(analyseRepo);

});

function analyseRepo(repo_path) {
	Git.Repository.open(repo_path)
	.then(function(repository) {
		return repository.getHeadCommit();	// Promise
	})
	.then(function(commit) {
		console.log(repo_path);
		console.log("Last commit:", commit.date(), commit.message(), commit.author().name());
		return commit.sha();
	});
}


// find all local git repos (under a certain folder) - OK
// exclude unwanted
// cache the list (text file)
// get last commit (modified?) date
// get total commits
// clean/dirty?
// remote status?
// display in list
