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

    const lastCommit = await octokit.rest.repos.getCommit({owner, repo, ref: 'heads/master'});

    console.log("the last commit date:")
    console.log(lastCommit.data.commit.committer.date)
    const commitDate = Date.parse(lastCommit.data.commit.committer.date)
    console.log("Commit was more than 5 minutes ago:")
    var now =  new Date();

// 86400 seconds in 24hrs
// and so 86400000 milliseconds in 24hr

// 60000 milliseconds in a minute 
// 300000 milliseconds in five minutes
if(300000 < now.getTime()-commitDate.getTime()) {
  console.log("true")
} else {
  console.log('false')
}

    const {collectionFileAsString, errors} = await dtsUtils.createDTSCollection(owner, repo, octokit)
    
    await saveFileToGithub(owner, repo, collectionFileAsString, "collection.json", "update collection", octokit)
    if (errors.length) {
      await saveFileToGithub(owner, repo, JSON.stringify(errors), "errors.json", "save errors from collection update", octokit)
    }


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