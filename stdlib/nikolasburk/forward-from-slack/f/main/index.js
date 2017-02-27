/* Import dependencies, declare constants */
require('isomorphic-fetch')
const Lokka = require('lokka').Lokka
const Transport = require('lokka-transport-http').Transport

const client = new Lokka({
  transport: new Transport('https://api.graph.cool/simple/v1/cizf8g3fr1sp90139ikdjayb7/')
})
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

  // params.kwargs contains values for the following keys:
  // token, team_id, team_domain, channel_id, channel_name,
  // user_id, user_name, text, command

  const message = params.kwargs['text']
  const slackChannelName = params.kwargs['channel_name']
  const slackUserId = params.kwargs['user_id']

  client.query(`
    {
      allConversations(filter: {
        slackChannelName: "${slackChannelName}"
      }) {
        id
        slackChannelName
      }
      allAgents(filter: {slackUserId: "${slackUserId}"}) {
        id
      }
    }
  `).then(response => {

    const conversationId = response.allConversations[0].id
    const agentId = response.allAgents[0].id

    client.mutate(`
    {
      createMessage(text: "${message}", conversationId: "${conversationId}", agentId: "${agentId}") {
        id
      }
    }
    `).then(response => {
      return callback(null, 'Posted message to Graphcool!  ' + slackChannelName + '; ' + conversationId)
    })
      .catch(error => {
        console.error('ERROR: ', error)
        return callback(error, 'Could not post message to Graphcool!  ' + responseString)
      })

  }).catch(error => {
    console.error('ERROR: ', error)
    return callback(error, 'Could not query conversations!')

  })




}


