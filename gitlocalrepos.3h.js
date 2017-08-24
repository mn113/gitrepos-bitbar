#!/usr/bin/env /usr/local/bin/node

/*
 * <bitbar.title>Git Local Repos</bitbar.title>
 * <bitbar.version>v0.2</bitbar.version>
 * <bitbar.author>M. Nicholson</bitbar.author>
 * <bitbar.author.github>mn113</bitbar.author.github>
 * <bitbar.image>https://github.com/mn113/gitrepos-bitbar/blob/master/gitlocalrepos-bitbar1.png</bitbar.image>
 * <bitbar.desc>List local git repos and their statuses</bitbar.desc>
 * <bitbar.dependencies>node,nodegit</bitbar.dependencies>
 */

const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;
const NodeGit = require('nodegit');

// User config:
const BASEDIR = '~/Dropbox/htdocs/2017';					// set your own basedir as desired
const EXCLUDES = [/\.bower/, /Library\//, /node_modules/, /phonecat/];	// list of regexes of paths to exclude
const NUMBER_OF_REPOS = 7;									// change as desired
const MAX_COMMITS = 200;									// change as desired
const GET_REPOS_CMD = "find " + BASEDIR + " -name .git";	// only change if you know what you're doing

const GITICON = "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABwElEQVQ4T32TTUtbQRSG33PmqgUt2l2k+yC4MOIHQiK9iaG0oKUi3Qr+ii7Tpf/BH9C6VcFqrIqIwRRq0OrGlYuiFHVrk9w5p9xrEmMyOqvhzPs+54shPHHGfD9WCfg7i7UWXe+PDzb/uqTkCg76fo8X8E8CBsJ3a+0ZUVfaBWkDhJmr1kxAMQvofD3BU5BHgFrZOwQbJ/ACiCtQvLaii8zwXJAG4MF8XzZBVo/2dz+E96Fkep2I3rnaiQCt5jCmiishTg70v7o4v7xZArDgaodc5rpQgW8kUGXdUuERwxpT2GnAdNbboUQy8wuEYeeKSJdF2FO1H7u1/LJQKNwNpTKfCVis6X9TIpXeAch/DkCkc2ATL+3lzxOpTA7Al0hvcUgj2Wyv/VfdBMx4G0TwFQwPwCcRXDPLCaBvAMNQHFWlIxsN0Q2RP+JhoiPwOFA5JEKskaBmPi1s3DbWGEIq5SBvlMcioWCtdLA9E14Tk5kNKN5G8Sbz/bqbTjNEBAEbypGIsao5Zjat5jZAlM33+yQweYaOPp4JlarWmwrLbo47P1M7hEqdFWSLxR83rYN2AuqVUIAVS/BelM2Myxzq/gMuDfaGij7JUwAAAABJRU5ErkJggg==";

// Set icon:
console.log("| dropdown=false templateImage='"+GITICON+"'");
console.log("---");

const months = ["January", "February", "March", "April", "May", "June",
"July", "August", "September", "October", "November", "December"];

// Prepare data containers:
var allRepoPaths = [];
var allRepos = [];

// Run a shell command to find all the .git directories:
// Process the results to keep just the most recently modified N .gits:
exec(GET_REPOS_CMD, (error, stdout, stderr) => {
    if (error) {
        console.error('stderr', stderr);
        throw error;
    }
	allRepoPaths = stdout.split(/\n/)
	.filter(repoPath => repoPath.length > 0)
	// Apply excludes:
	.filter(repoPath => {
		return EXCLUDES.every(exc => {
			return repoPath.search(exc) === -1;
		});
	})
	// Attach index modified time:
	.map(repoPath => {
		var stats = fs.statSync(repoPath+'/index');
		return {
			path: repoPath,
			mtime: new Date(stats.mtime).getTime()
		};
	})
	// Most recent first:
	.sort((a,b) => b.mtime - a.mtime)
	// Limit by number:
	.slice(0, NUMBER_OF_REPOS)
	// Discard mtime:
	.map(obj => obj.path)

	//console.warn(allRepoPaths);

	allRepos = allRepoPaths.map(analyseRepo);	// array of Promises

	// Wait until everything is retrieved & processed:
	Promise.all(allRepos).then(readyRepos => output(readyRepos));
});

// Using nodegit, open up each repo and save its key details to an object:
// Function should return a Promise of the reduced repo object
function analyseRepo(repoPath) {
	var repo = {
		fullpath: repoPath,
		parentpath: repoPath.substring(0,repoPath.lastIndexOf(path.sep)),
	};
	repo.dirname = path.basename(repo.parentpath);

	return NodeGit.Repository.open(repoPath)	// Promise
	.then(function(repository) {
		// Extract repo info:
		repo.branch = repository.getCurrentBranch()
		.then(ref => {
			return path.basename(ref.name());
		});

		repo.deltas = NodeGit.Diff.indexToWorkdir(repository)
		.then(diff => {
			return diff.numDeltas();
		});

		repo.remotes = repository.getReferenceNames(3)
		.then(arrayString => {
			// Keep only remote's name/branch:
			return arrayString
				.filter(str => str.includes('remotes'))
				.map(str => str.slice(str.indexOf('remotes') + 8));
		})
		.catch(err => {});

		repo.totalCommits = countCommits(repository);

		// Export values and move on to last commit when we're done here:
		return Promise.all([repo.branch, repo.deltas, repo.remotes, repo.totalCommits])
		.then(function([branch, deltas, remotes, totalCommits]) {
			// Assign resolved values to repo object:
			repo.branch = branch;
			repo.deltas = deltas;
			repo.remotes = remotes;
			repo.totalCommits = totalCommits;

			return repository.getHeadCommit();	// Promise
		});
	})
	.then(function(commit) {
		// Extract last commit info:
		repo.lastCommitSHA = commit.sha();
		repo.lastCommitDate = commit.date();
		repo.lastCommitMessage = commit.message().replace(/(-|\s)+/g, ' ');	// strip dashes & newlines
		repo.lastCommitAuthor = commit.author().name() + ' <' + commit.author().email() + '>';
		// By this point repository & commit Promises have resolved
		// Return the repo in a Promise:
		return Promise.resolve(repo);
	})
	.catch(function(error) {
		console.error(error);
	});
}

// Count commits from HEAD backwards:
function countCommits(repository) {
	// Walk the repo to count commits:
	// (Might not count other branches)
	var revwalk = repository.createRevWalk();
	revwalk.sorting(NodeGit.Revwalk.SORT.REVERSE);
	revwalk.pushHead();	// places us at the last commit

	return revwalk.getCommits(MAX_COMMITS)
	.then(arrayOfCommits => {
		return arrayOfCommits.length;
	})
	.catch(err => {
		console.log('err', err);
	});
}

// Show most recent ones first:
function sortRecent(a,b) {
	return b.lastCommitDate - a.lastCommitDate;
}

// Output:
function output(displayRepos) {
	console.log("Local git repos (most recent first):");
	console.log("---");
	displayRepos
		.forEach(function(repo) {
			var d = repo.lastCommitDate;
			var status = (repo.deltas > 0) ? "clean | color=lawngreen" : "changed files | color=indianred";
			// Format display for menubar:
			console.log(repo.dirname, "| font=LucidaGrande-Bold color=black");
			console.log("Status:", status, "size=11");
			if (repo.remotes.length > 0)
				console.log("Remotes:", repo.remotes.join(', '), "| size=11 color=#808080");
			console.log("", repo.totalCommits, "total commits | size=11 color=#808080");
			console.log("Last commit on", d.getDate(), months[d.getMonth()].slice(0,3), ":", repo.lastCommitMessage, "| length=50 size=12");
			console.log("--", repo.lastCommitSHA.slice(0,7));
			console.log("--on branch", repo.branch);
			console.log("--by", repo.lastCommitAuthor);
			console.log("--date:", d.toString());
			console.log("--Show repo in Finder | bash=open param1="+repo.parentpath+" terminal=true");
			console.log("---");
		});
	// Menubar afters:
	console.log("Options");
	console.log("--Set your base folder, excludes and repo limit in the script");
	console.log("--Open script file | bash='${EDITOR:-nano}' param1="+__filename);
	console.log("--Reload plugin | refresh=true terminal=false");
}
