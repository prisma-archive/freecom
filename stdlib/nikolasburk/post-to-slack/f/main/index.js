/* Import dependencies, declare constants */
require('isomorphic-fetch')

const token = 'xoxp-143869968915-143869969027-147144818550-66059a896db494ecfd2afdee0f3f306b'

module.exports = (params, callback) => {

  console.log('Execute function ...')

  let username

  if (params.kwargs.createdNode.agent) {
    username = params.kwargs.createdNode.agent.slackUserName
  }
  else {
    username = params.kwargs.createdNode.conversation.customer.name
  }

  const text = params.kwargs.createdNode.text
  const slackChannelName = params.kwargs.createdNode.conversation.slackChannelName

  const slackURL = `https://slack.com/api/chat.postMessage?
    token=${token}&channel=${slackChannelName}&username=${username}&text=${text}`

  fetch(slackURL,
  {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'GET',
  })
  .then(() => {
    return callback(null, 'Posted message to Slack!\n\n' + slackURL)
  })
  .catch(error => {
    return callback(error, null)
  })

}
