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
            text
            createdAt
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
              createMessage(filter: {
              conversation: {
              id: "${this.props.conversationId}"
              }
              }) {
                  text
                  createdAt
              }
          }
      `,
      updateQuery: (previousState, {subscriptionData}) => {
        console.log('Subscription received: ', previousState, subscriptionData)
        const newMessage = subscriptionData.data.createMessage
        const messages = previousState.allMessages ? previousState.allMessages.concat([newMessage]) : [newMessage]

        return {
          allMessages: messages,
        }
      },
      onError: (err) => console.error(err),
    })
  }

  render() {
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