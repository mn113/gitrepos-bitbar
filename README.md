# GitLocalRepos BitBar plugin

This is a plugin for [BitBar](https://github.com/matryer/bitbar). It displays information about your local git repos in your Mac's menu bar.

![GitLocalRepos screenshot](http://i.imgur.com/9AHhMZL.png)


## Dependencies

* [BitBar](https://github.com/matryer/bitbar)
* [Node.js](https://nodejs.org)
* [Nodegit](https://www.nodegit.org)


## Installation

Download [gitlocalrepos.3h.js](https://github.com/mn113/gitrepos-bitbar/blob/master/gitlocalrepos.3h.js) and carefully place it into your BitBar Plugins folder.

Navigate to this folder and then install the dependency:

`npm install --save nodegit`

The GitLocalRepos plugin will appear in your menu bar the next time BitBar refreshes.


## Configuration

You can (and should) edit the following constants near the top of the Javascript file.

* BASEDIR: the base directory in which the script will start searching for git repos. Suggested: '~'
* EXCLUDES: array of regexes, against which found repo paths will be checked and excluded
* NUMBER_OF_REPOS: how many repos to display in the menubar dropdown
* MAX_COMMITS: just leave this as 1000 unless you need more than that

You can also change the frequency with which the script re-checks your filesystem. Do this by editing its filename. Change the '3h' (every 3 hours) to '12h' or '1d' for example.


## Project status

More or less completed, stable, more features may still be added.


## Contributing

This project is not looking for contributions, but any [issues](https://github.com/mn113/gitrepos-bitbar/issues/) created (bugs, ideas) will be addressed.

This repo is non-commercial and is provided as-is for no other purpose than entertainment, education and curiosity. Fork it, play with it, inspect it, but don't do anything that depends on it.


## License

This project is licensed under the MIT License.
