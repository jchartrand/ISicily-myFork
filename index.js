const core = require('@actions/core');
const github = require('@actions/github');
const {Base64} = require('js-base64');
const dtsUtils = require('./dtsUtils.js')

const main = async () => {
  try {

    const owner = core.getInput('owner', { required: true });
    const repo = core.getInput('repo', { required: true });
    const commit_sha = core.getInput('sha', {required: true});
    const token = core.getInput('token', { required: true });

    const octokit = new github.getOctokit(token);

    /**
     * 
     * - get the previously stored collection file.
     * - if one doesn't exist, rebuild entire collection, then exit.
     * - if one does exist, get list of changes files (inscriptions) for the commit
     * - if there are more than 100 changed files in the commit, rebuild all
     * - if fewer than 100, then loop over changes files (inscriptions) generating a new collection entry for each.
     * - add each new collection entry, or replace existing entry for the inscription.
     * 
     */

    // NOTE: the ref here is the triggering commit sha, but could be
    // any reference, like the head of the master branch (heads/BRANCH_NAME) or a
    // tag name (tags/TAG_NAME)
    const theCommit = await octokit.rest.repos.getCommit({owner, repo, ref: commit_sha});
    
    //octokit.rest.git.getCommit({owner, repo, commit_sha});
   
    
    const collectionFileAsString = dtsUtils.createDTSCollection(owner, repo)
    saveFileToGithub(owner, repo, collectionFileAsString, octokit)


  } catch (error) {
    console.log("error when trying to get the commit?????")
    console.log(error)
    core.setFailed(error.message);
  }
}

async function getManifestSha(owner, repo, path, octokit) {
  let sha
  try {
    const response = await octokit.rest.repos.getContent({owner, repo, path})
    sha = response.data.sha
  } catch (e) {
    console.log(`Couldn't find ${path} in Github repository ${owner}/${repo}: ${e}`);
  }
    return sha
}

async function saveFileToGithub(owner, repo, fileContentsAsString, octokit) {
  let path = `collection.json`
    try {
        const sha = await getManifestSha(owner, repo, "collection.json", octokit)
       // let content = Buffer.from(fileContentsAsString).toString('base64')
       let content = Base64.encode(fileContentsAsString)
       let message = "update collection"
       let config = {owner, repo, path, message, content, ...(sha && {sha})}
       const result = await octokit.rest.repos.createOrUpdateFileContents(config)
    } catch (e) {
        console.log(`Problem saving file ${path} back to the Github repository: ${e}`);
    }
}

// Call the main function to run the action
main();