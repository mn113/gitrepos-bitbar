#!/usr/bin/env /Users/martin/.nvm/versions/node/v7.1.0/bin/node

const fs = require('fs');
const path = require('path');
const Git = require('nodegit');

// User config:
const basedir = '~/Dropbox/Python';		// modify as desired
const GET_REPOS_CMD = "find " + basedir + " -name .git";
const excludes = ["^\.", "Library\/"];	// TODO

var allRepoPaths = [];
var allRepos = [];

// Run a shell command to find all the .git directories:
const exec = require('child_process').exec;
exec(GET_REPOS_CMD, (error, stdout, stderr) => {
    if (error) {
        console.error('stderr', stderr);
        throw error;
    }
	allRepoPaths = stdout.split(/\n/).filter(str => str.length > 0);
    console.log(allRepoPaths);

	console.log("Local git repos:");
	allRepoPaths.forEach(analyseRepo);
});

// Using nodegit, open up each repo and save its details to an object:
function analyseRepo(repo_path) {
	var repo = {
		fullpath: repo_path
	};

	Git.Repository.open(repo_path)
	.then(function(repository) {
		// Extract repo info:
		repo.remotes = [];
		repo.dir = '';
		repo.branch = '';
		repo.totalCommits = 0;
		// Move on to last commit:
		return repository.getHeadCommit();	// Promise
	})
	.then(function(commit) {
		// Extract last commit info:
		repo.lastCommitDate = commit.date();
		repo.lastCommitMessage = commit.message();
		repo.lastCommitAuthor = commit.author().name();
		console.log(repo);
		allRepos.push(repo);
	});
}

// Most recent ones first:
function sortRecent(repos) {
	return repos.sort(function(a,b) {
		return b.lastCommitTime - a.lastCommitTime;
	});
}

// Output:
function output() {
	sortRecent(allRepos).forEach(function(repo) {
		// Format display for menubar:
		console.log(repo.dir);
		console.log("Last commit:", repo.lastCommitDate, "| size=12 color=#999");
		console.log("--"+repo.lastCommitMessage);
		console.log("--"+repo.branch);
		console.log("--"+repo.author);
		console.log("--"+repo.totalCommits, "total commits");
		console.log("--Open in iTerm");
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
