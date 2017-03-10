/* Import dependencies, declare constants */
require('isomorphic-fetch')

const token = 'xoxp-143869968915-143869969027-147144818550-66059a896db494ecfd2afdee0f3f306b'

module.exports = (params, callback) => {

  const slackChannelName = params.kwargs.createdNode.slackChannelName.toLowerCase()

  fetch('https://slack.com/api/channels.create?token=' + token + '&name=' + slackChannelName,
    {
      method: 'GET',
    })
    .then(() => {

      const text = 'New channel created: %23' + slackChannelName
      const username = 'Freecom Bot'
      const slackURL = `https://slack.com/api/chat.postMessage?token=${token}&username=${username}&channel=general&text=${text}`

      fetch(slackURL,
        {
          method: 'GET',
        })
        .then(() => {
          callback(null, 'Created new Slack channel called: ' + slackChannelName)
        })
        .catch(error => {
          return callback(error, null)
        })

    })
    .catch(error => {
      return callback(error, 'Error while creating new Slack channel')
    })

}


