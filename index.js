const core = require('@actions/core');
const github = require('@actions/github');
const {Base64} = require('js-base64');
const dtsUtils = require('./dtsUtils.js')

const main = async () => {
  try {

    const owner = core.getInput('owner', { required: true });
    const repo = core.getInput('repo', { required: true });
    const token = core.getInput('token', { required: true });

    const octokit = new github.getOctokit(token);

    const lastCommit = await octokit.rest.repos.getCommit({owner, repo, ref: 'heads/master'});
    const commitTimestamp = Date.parse(lastCommit.data.commit.committer.date)
    var now =  new Date();
    

    if(tenMinutesAsMilliseconds < now.getTime()-commitTimestamp) {
      console.log("A commit occurred in the last ten minutes so running build...")
    } else {
      console.log('A commit did not occur in the last 10 minutes so exiting without rebuild.');
      return
    }

    const {collectionFileAsString, errors} = await dtsUtils.createDTSCollection(owner, repo, octokit)
    
    await saveFileToGithub(owner, repo, collectionFileAsString, "collection.json", "update collection", octokit)
    if (errors.length) {
      await saveFileToGithub(owner, repo, JSON.stringify(errors), "errors.json", "save errors from collection update", octokit)
    }


  } catch (error) {
    console.log("error when running the rebuild")
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

async function saveFileToGithub(owner, repo, fileContentsAsString, path, message, octokit) {
    try {
        const sha = await getManifestSha(owner, repo, path, octokit)
       // let content = Buffer.from(fileContentsAsString).toString('base64')
       let content = Base64.encode(fileContentsAsString)
       let config = {owner, repo, path, message, content, ...(sha && {sha})}
       const result = await octokit.rest.repos.createOrUpdateFileContents(config)
    } catch (e) {
        console.log(`Problem saving file ${path} back to the Github repository: ${e}`);
    }
}

// Call the main function to run the action
main();