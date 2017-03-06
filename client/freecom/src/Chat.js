import React, { Component } from 'react'
import './Chat.css'
import ChatInput from './ChatInput'
import ChatMessages from './ChatMessages'
import { graphql, compose } from 'react-apollo'
import gql from 'graphql-tag'
import Dropzone from 'react-dropzone'

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
            conversation {
                id
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
    isUploadingImage: false,
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
        console.debug('Subscription received: ', previousState, subscriptionData)
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
      <Dropzone
        className='Dropzone'
        onDrop={this._onFileDrop}
        accept='image/*'
        multiple={false}
        disableClick={true}
      >
        <div className='message-body overflow-scroll'>
          <ChatMessages
            messages={this.props.allMessagesQuery.allMessages || []}
          />
          {this.state.isUploadingImage &&
          <div className='UploadImageIndicator'>Uploading image ...</div>
          }
          <ChatInput
            message={this.state.message}
            onTextInput={message => this.setState({message})}
            onResetText={() => this.setState({message: ''})}
            onSend={this._onSend}
            onDrop={this._onFileDrop}
          />
        </div>
      </Dropzone>
    )
  }

  _onSend = () => {
    console.debug('Send message: ', this.state.message, this.props.conversationId, this.props.createMessageMutation)
    // this.props.createMessageMutation({
    //   variables: {
    //     text: this.state.message,
    //     conversationId: this.props.conversationId,
    //   }
    // })
    this.props.createMessageMutation(this.state.message, this.props.conversationId)
  }

  _onFileDrop = (acceptedFiles, rejectedFiles) => {
    console.debug('Accepted files: ', acceptedFiles)
    console.debug('Rejected files: ', rejectedFiles)

    // prepare form data, use data key!
    let data = new FormData()
    data.append('data', acceptedFiles[0])

    this.setState({isUploadingImage: true})

    // use the file endpoint
    fetch('https://api.graph.cool/file/v1/cizf8g3fr1sp90139ikdjayb7', {
      method: 'POST',
      body: data
    }).then(response => {
      return response.json()
    }).then(image => {
      this.props.createMessageMutation({
        variables: {
          text: 'Uploaded image',
          conversationId: this.props.conversationId,
        }
      })
      this.setState({isUploadingImage: false})
    }).catch(error => {
      this.setState({isUploadingImage: false})
    })
  }

}

const ChatWithAllMessages = graphql(allMessages, {name: 'allMessagesQuery'})(Chat)
export default graphql(createMessage, {
  props({ownProps, mutate}) {
    return {
      createMessageMutation(text, conversationId) {
        return mutate({
          variables: { text, conversationId },
          updateQueries: {
            allConversations: (previousState, {mutationResult}) => {
              console.debug('Chat - did send mutation for allConversationsQuery: ', previousState, mutationResult)
              return previousState
            }
          }
        })
      }
    }
  }
})(ChatWithAllMessages)

Chat.PropTypes = {
  conversationId: React.PropTypes.string.isRequired,
  allMessagesQuery: React.PropTypes.any.isRequired,
}

// export default compose(
//   // graphql(findConversations, {name: 'findConversationsQuery'}),
//   graphql(allMessages, {name: 'allMessagesQuery'}),
//   graphql(createMessage, {name : 'createMessageMutation'})
// )(Chat)