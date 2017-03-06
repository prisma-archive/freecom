/* Import dependencies, declare constants */
require('isomorphic-fetch')

/**
 * Your function call
 * @param {Object} params Execution parameters
 *   Members
 *   - {Array} args Arguments passed to function
 *   - {Object} kwargs Keyword arguments (key-value pairs) passed to function
 *   - {String} remoteAddress The IPv4 or IPv6 address of the caller
 *
 * @param {Function} callback Execute this to end the function call
 *   Arguments
 *   - {Error} error The error to show if function fails
 *   - {Any} returnValue JSON serializable (or Buffer) return value
 */

// naming convention for channels:
// <customerId>-<position>-<conversationId>
// where position is an integer that gets incremented with
// each conversation started by this customer

module.exports = (params, callback) => {

  // const conversationId = params.kwargs.createdNode.id
  // const customerId = params.kwargs.createdNode.customer.id
  // const customerName = params.kwargs.createdNode.customer.name
  const slackChannelName = params.kwargs.createdNode.slackChannelName.toLowerCase()
  // const customerId = params.kwargs.channel

  // const text = 'Create new slack channel: ' + slackChannelName + '\n\n' + JSON.stringify(params.kwargs)
  // slack logging
  // fetch('https://hooks.slack.com/services/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',
  //   {
  //     headers: {
  //       'Content-Type': 'application/json'
  //     },
  //     method: 'POST',
  //     body: `{"text":"${text}", "username": "LOGGING"}`
  //   })
  //   .then(response => {

  // first fetch all existing channels to check the position of the channel to be created
  // fetch('https://slack.com/api/channels.list?token=xoxp-143869968915-143869969027-147144818550-66059a896db494ecfd2afdee0f3f306b',
  //   {
  //     method: 'GET',
  //   })
  //   .then(res => res.json())
  //   .then(json => {
  //
  //     // return callback(null, JSON.stringify(json))
  //
  //     const channels = json.channels
  //     const channelsForCurrentUser = channels.filter(channel => {
  //       return channel.name.startsWith(customerId)
  //     })
  //
  //     let channelName = ''
  //     if (channelsForCurrentUser.length === 0) {
  //       // create new channel
  //       channelName = customerId + '-' + 0 + '-' + conversationId
  //     }
  //     else {
  //       // find channel with greatest position appended as suffix
  //       const channelPositions = channels.map(channel => {
  //         return channel.name.substring(0, customerId.length + 1)
  //       })
  //       const maxPosition = Math.max.apply(null, channelPositions)
  //       const newChannelPosition = maxPosition + 1
  //       channelName = customerId + '-' + newChannelPosition + '-' + conversationId
  //     }

  // const jsonString = JSON.stringify(json)

  // then create new slack channel
  fetch('https://slack.com/api/channels.create?token=xoxp-143869968915-143869969027-147144818550-66059a896db494ecfd2afdee0f3f306b&name=' + slackChannelName,
    {
      method: 'GET',
    })
    .then(_ => {
      callback(null, 'Created new Slack channel called: ' + slackChannelName)
    })
    .catch(error => {
      return callback(error, 'Error while creating new Slack channel')
    })

  // })
  // .catch(error => {
  //   console.error(error)
  //   return callback(error, 'Error while retrieving all Slack channels')
  // })

  // })






  // callback(null, 'Hmm, something did not work out.')

}


// https://slack.com/api/channels.list?token=xoxp-143869968915-143869969027-147144818550-66059a896db494ecfd2afdee0f3f306b

