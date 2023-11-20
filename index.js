const core = require('@actions/core');
const github = require('@actions/github');
//const {Base64} = require('js-base64');

const main = async () => {
  try {

    const owner = core.getInput('owner', { required: true });
    const repo = core.getInput('repo', { required: true });
    const commitSha = core.getInput('sha', {required: true});
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
   // const theCommit = await octokit.rest.git.getCommit({owner, repo, sha});
   // saveFileToGithub(owner, repo, theCommit.toString())


  } catch (error) {
    core.setFailed(error.message);
  }
}

async function getManifestSha(owner, repo, path) {
    const { data: { sha } } = await github.repos.getContent({owner, repo, path})
    return sha
}

async function saveFileToGithub(owner, repo, fileContentsAsString) {
    try {
        //const sha = await getManifestSha(owner, repo, "collection.json")
        let path = `collection.json`
       // let content = Buffer.from(fileContentsAsString).toString('base64')
       //let content = Base64.encode(fileContentsAsString)
       // let message = "update collection"
       // let config = {owner, repo, path, message, content, ...(sha && {sha})}
       // const result = await github.rest.repos.createOrUpdateFileContents(config)
    } catch (e) {
        console.log(`Problem saving file ${path} back to the Github repository: ${e}`);
    }
}

// Call the main function to run the action
main();