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
  const slackUserName = params.kwargs['user_name']

  client.query(`
    {
      allConversations(filter: {
        slackChannelName: "${slackChannelName}"
      }) {
        id
        slackChannelName
        agent {
          id
          slackUserName
          slackUserId
        }
      }
      allAgents(filter: {slackUserId: "${slackUserId}"}) {
        id
      }
    }
  `).then(response => {

    const conversation = response.allConversations[0]
    const conversationId = conversation.id

    if (response.allAgents.length > 0) {

      const agentId = response.allAgents[0].id
      const needToUpdateAgentInConversation = conversation.agent ?  (agentId !== conversation.agent.id) : true

      const mutationWithoutUpdatingAgent = `
      {
        createMessage(text: "${message}", conversationId: "${conversationId}", agentId: "${agentId}") {
          id
        }
      }
      `

      const mutationWitUpdatingAgent = `
      {
        createMessage(text: "${message}", conversationId: "${conversationId}", agentId: "${agentId}") {
          id
        }
        updateConversation(id: "${conversationId}", agentId: "${agentId}") {
          id
        }
      }
      `
      const createMessageMutation = needToUpdateAgentInConversation ?
        mutationWitUpdatingAgent : mutationWithoutUpdatingAgent

      client.mutate(createMessageMutation)
        .then(() => {
          let response = 'Posted message to Graphcool:  \'' + message + '\' (conversation:  ' + conversationId + ')'
          if (needToUpdateAgentInConversation) {
            response = response + '\n: Also updated the agent in the conversation: ' + agentId
          }
          return callback(null, response)
        }).catch(error => {
        return callback(error, 'Could not post message to Graphcool!  ' + responseString)
      })

    }
    else {

      client.mutate(`
        {
          updateConversation(id: "${conversationId}", agent: {
            slackUserId: "${slackUserId}",
            slackUserName: "${slackUserName}",
          }) {
            id
            agent {
              id
            }
          }
        }
      `).then(response => {
        const agentId = response.updateConversation.agent.id
        client.mutate(`
          {
            createMessage(text: "${message}", conversationId: "${conversationId}", agentId: "${agentId}") {
              id
            }
          }
        `).then(() => {
          let response = 'Posted message to Graphcool:  \'' + message + '\' (conversation:  ' + conversationId + ')'
          response = response + '\n: Also created new agent in the conversation: ' + agentId
          return callback(null, response)

        }).catch(error => {
          return callback(error, 'Could not post message to Graphcool!  ' + responseString)
        })

      }).catch(error => {
        return callback(error, 'Could not create new agent!  ' + responseString)
      })
    }


  }).catch(error => {
    return callback(error, 'Could not query conversations!')
  })

}


