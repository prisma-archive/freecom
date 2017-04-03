require('isomorphic-fetch')
const Lokka = require('lokka').Lokka
const Transport = require('lokka-transport-http').Transport

const client = new Lokka({
  transport: new Transport('https://api.graph.cool/simple/v1/cizf8g3fr1sp90139ikdjayb7/')
})

const token = 'xoxp-143869968915-143869969027-147144818550-66059a896db494ecfd2afdee0f3f306b&user=U4E7PEQ4C'

module.exports = (params, callback) => {

  const message = params.kwargs['text']
  const slackChannelName = params.kwargs['channel_name']
  const slackUserId = params.kwargs['user_id']
  const slackUserName = params.kwargs['user_name']

  const slackChannelNameComponents = slackChannelName.split('-')
  const customerName = slackChannelNameComponents.slice(0, slackChannelNameComponents.length-1).join('-')
  const conversationIndex = slackChannelNameComponents[slackChannelNameComponents.length-1]

  client.query(`
    {
      allConversations(filter: {
        customer: { name: "${customerName}" },
        slackChannelIndex: ${conversationIndex}
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

      // get the profile picture url for that slack agent and update it in the Graphcool backend
      const token = 'xoxp-143869968915-143869969027-147144818550-66059a896db494ecfd2afdee0f3f306b&user=U4E7PEQ4C'
      const userInfoURL = `https://slack.com/api/users.info?token=${token}&user=${slackUserId}`
      fetch(userInfoURL).then(response =>
        response.json()
      ).then(json => {
          client.mutate(`
          {
            updateAgent(id: "${agentId}", imageUrl: "${json.user.profile.image_48}") {
              id
            }
          }
          `)
      })

      // the agent who sent the message is already registered in the Graphcool backend
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

      // there is no agent in the Graphcool backend yet, so we create it directly when updating the conversation
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

        // get the profile picture url for that slack agent and update it in the Graphcool backend
        const userInfoURL = `https://slack.com/api/users.info?token=${token}&user=${slackUserId}`
        fetch(userInfoURL).then(response =>
          response.json()
        ).then(json => {
          client.mutate(`
          {
            updateAgent(id: "${agentId}", imageUrl: "${json.user.profile.image_48}") {
              id
            }
          }
          `)
        })

        // create the message in the Graphcool backend
        const agentId = response.updateConversation.agent.id
        client.mutate(`
          {
            createMessage(text: "${message}", conversationId: "${conversationId}", agentId: "${agentId}") {
              id
            }
          }
        `).then(() => {
          let response = 'Posted message to Graphcool:  \'' + message + '\' (conversation:  ' + conversationId + ').'
          response = response + ' Also set you as the new agent in the conversation.'
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


