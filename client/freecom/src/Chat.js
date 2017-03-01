import React, { Component } from 'react'
import './Chat.css'
import ChatInput from './ChatInput'
import ChatMessages from './ChatMessages'
import { graphql, compose } from 'react-apollo'
import gql from 'graphql-tag'

const findConversations = gql`
    query allConversations($customerId: ID!) {
        allConversations(filter: { 
        customer: {
            id: $customerId
        } }){
            id
            slackChannelName
        }
    }
`


const createMessage = gql`
    mutation createMessage($text: String!, $conversationId: ID!) {
        createMessage(text: $text, conversationId: $conversationId) {
            id
            text
            createdAt
            agent {
                id
                slackUserName
            }
        }
    }
`

const allMessages = gql`
    query allMessages($conversationId: ID!) {
        allMessages(filter: {
          conversation: {
            id: $conversationId
          }
        })
        {
            id
            text
            createdAt
            agent {
                id
                slackUserName
            }
        }
    }
`

class Chat extends Component {

  state = {
    message: '',
  }

  componentWillReceiveProps(nextProps) {
    console.log('Chat - componentWillReceiveProps', nextProps)
  }

  componentDidMount() {

    this.newMessageSubscription = this.props.allMessagesQuery.subscribeToMore({
      document: gql`
          subscription {
              Message(filter: {
                AND: [{
                  mutation_in: [CREATED]
                }, {
                  node: {
                    conversation: {
                      id: "${this.props.conversationId}"
                    }
                  }
                }]  
              }) {
                  node {
                      id
                      text
                      createdAt
                      agent {
                          id
                          slackUserName
                      }
                  }
              }
          }
      `,
      updateQuery: (previousState, {subscriptionData}) => {
        console.log('Subscription received: ', previousState, subscriptionData)
        const newMessage = subscriptionData.data.Message.node
        const messages = previousState.allMessages ? previousState.allMessages.concat([newMessage]) : [newMessage]

        return {
          allMessages: messages,
        }
      },
      onError: (err) => console.error('An error occured while being subscribed: ', err),
    })
  }

  render() {

    if (this.props.allMessagesQuery.loading) {
      return <div>Loading messages ...</div>
    }

    return (
      <div className='Chat'>
        <ChatMessages
          messages={this.props.allMessagesQuery.allMessages || []}
        />
        <ChatInput
          message={this.state.message}
          onTextInput={message => this.setState({message})}
          onResetText={() => this.setState({message: ''})}
          onSend={this._onSend}
        />
        <div
          className='BackButton'
          onClick={() => this.props.resetConversation()}
        >Back</div>
      </div>
    )
  }

  _onSend = () => {
    console.log('Send message: ', this.state.message, this.props.conversationId)
    this.props.createMessageMutation({
      variables: {
        text: this.state.message,
        conversationId: this.props.conversationId,
      }
    })
  }

}

export default compose(
  graphql(findConversations, {name: 'findConversationsQuery'}),
  graphql(allMessages, {name: 'allMessagesQuery'}),
  graphql(createMessage, {name : 'createMessageMutation'})
)(Chat)