require('isomorphic-fetch')

const token = 'xoxp-143869968915-143869969027-147144818550-66059a896db494ecfd2afdee0f3f306b'

module.exports = (params, callback) => {

  console.log('Execute function ...')

  let username
  let emoji

  if (params.kwargs.createdNode.agent) {
    username = params.kwargs.createdNode.agent.slackUserName
    emoji = ':telephone_receiver:'
  }
  else {
    username = params.kwargs.createdNode.conversation.customer.name
    emoji = ':question:'
  }

  const text = params.kwargs.createdNode.text
  // const slackChannelName = params.kwargs.createdNode.conversation.slackChannelName
  const customerName = params.kwargs.createdNode.conversation.customer.name.toLowerCase()
  const numberOfExistingConversations = params.kwargs.createdNode.conversation.customer._conversationsMeta.count
  const slackChannelName = customerName + '-' + params.kwargs.createdNode.conversation.slackChannelIndex

  const slackURL = `https://slack.com/api/chat.postMessage?token=${token}&channel=${slackChannelName}&username=${username}&text=${text}&icon_emoji=${emoji}`

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
