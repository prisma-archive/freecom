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
module.exports = (params, callback) => {

  console.log('Execute function ...')

  const text = params.kwargs.createdNode.text
  const slackChannelName = params.kwargs.createdNode.conversation.slackChannelName
  const username = params.kwargs.createdNode.conversation.customer.name

  let slackURL = 'https://slack.com/api/chat.postMessage?token=xoxp-143869968915-143869969027-147144818550-66059a896db494ecfd2afdee0f3f306b'
  slackURL = slackURL + '&' + 'channel=' + slackChannelName
  slackURL = slackURL + '&' + 'username=' + username
  slackURL = slackURL + '&' + 'text=' + text

  fetch(slackURL,
  {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'GET',
  })
  .then(response => {
    return callback(null, 'Posted message to Slack!\n\n' + slackURL)
  })
  .catch(error => {
    return callback(error, null)
  })

}
