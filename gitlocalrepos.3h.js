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
// clean/dirty? - OK
// remote status?
// display in list - OK

const path = require('path');
const exec = require('child_process').exec;
const Git = require('nodegit');

// User config:
const basedir = '~/Dropbox/htdocs/2017';	// set your own basedir as desired
const excludes = [/\.bower/, /Library\//, /node_modules/, /phonecat/];	// list of regexes of paths to exclude
const numberOfRepos = 2;						// change if you want
const GET_REPOS_CMD = "find " + basedir + " -name .git";	// only change if you know what you're doing

const GITICON = "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABwElEQVQ4T32TTUtbQRSG33PmqgUt2l2k+yC4MOIHQiK9iaG0oKUi3Qr+ii7Tpf/BH9C6VcFqrIqIwRRq0OrGlYuiFHVrk9w5p9xrEmMyOqvhzPs+54shPHHGfD9WCfg7i7UWXe+PDzb/uqTkCg76fo8X8E8CBsJ3a+0ZUVfaBWkDhJmr1kxAMQvofD3BU5BHgFrZOwQbJ/ACiCtQvLaii8zwXJAG4MF8XzZBVo/2dz+E96Fkep2I3rnaiQCt5jCmiishTg70v7o4v7xZArDgaodc5rpQgW8kUGXdUuERwxpT2GnAdNbboUQy8wuEYeeKSJdF2FO1H7u1/LJQKNwNpTKfCVis6X9TIpXeAch/DkCkc2ATL+3lzxOpTA7Al0hvcUgj2Wyv/VfdBMx4G0TwFQwPwCcRXDPLCaBvAMNQHFWlIxsN0Q2RP+JhoiPwOFA5JEKskaBmPi1s3DbWGEIq5SBvlMcioWCtdLA9E14Tk5kNKN5G8Sbz/bqbTjNEBAEbypGIsao5Zjat5jZAlM33+yQweYaOPp4JlarWmwrLbo47P1M7hEqdFWSLxR83rYN2AuqVUIAVS/BelM2Myxzq/gMuDfaGij7JUwAAAABJRU5ErkJggg==";

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
	repo.dirname = path.basename(repo.parentpath);

	return Git.Repository.open(repo_path)	// Promise
	.then(function(repository) {
		// Extract repo info:
		repo.deltas = Git.Diff.indexToWorkdir(repository).then(diff => {
			return diff.numDeltas;
		});
		repo.remotes = repository.getRemotes().then(remotes => {
			return Object.keys(remotes).join(', ');
		});
		repo.branch = repository.getCurrentBranch().then(ref => {
			return path.basename(ref.name());
		});
		repo.totalCommits = 0;	// TODO

		return Promise.all([repo.deltas, repo.remotes, repo.branch])
		.then(function([deltas,remotes,branch]) {
			// Assign resolved values to repo object:
			repo.deltas = deltas;
			repo.remotes = remotes;
			repo.branch = branch;

			// Move on to last commit when we're done here:
			return repository.getHeadCommit();	// Promise
		});
	})
	.then(function(commit) {
		// Extract last commit info:
		repo.lastCommitSHA = commit.sha();
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
function sortRecent(a,b) {
	return b.lastCommitDate - a.lastCommitDate;
}

// Output:
function output(displayRepos) {
	console.log("Local git repos: | templateImage='" + GITICON + "'");
	//console.log("AR", displayRepos[0]);
	console.log("---");
	displayRepos
		.sort(sortRecent)
		.slice(0, numberOfRepos)
		.forEach(function(repo) {
			var status = (repo.deltas > 0) ? "clean | color=green" : "changed files | color=indianred";
			// Format display for menubar:
			console.log(repo.dirname, "| font=LucidaGrande-Bold color=black");
			console.log("Status:", status, " size=11");
			console.log("Remotes:", repo.remotes, "| size=11 color=#999999");
			console.log(repo.totalCommits, "total commits | size=11 color=#999999");
			console.log("Last commit:", repo.lastCommitMessage, "| length=40 size=12");
			console.log("--", repo.lastCommitSHA.slice(0,7));
			console.log("--on branch", repo.branch);
			console.log("--by", repo.lastCommitAuthor);
			console.log("--date:", repo.lastCommitDate);
			console.log("--Show repo in Finder | bash=open param1="+repo.parentpath+" terminal=true");
			console.log("---");
		});
	console.log("Options");
	console.log("--Set your base folder, excludes and repo limit in the script");
	console.log("--Open script file | bash='${EDITOR:-nano}' param1="+__filename);
	console.log("--Reload plugin | refresh=true terminal=false");
}
