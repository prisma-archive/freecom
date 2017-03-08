import React, { Component } from 'react'
import './Chat.css'
import './App.css'
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
        imageUrl
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
        imageUrl
      }
    }
  }
`

class Chat extends Component {

  static propTypes = {
    conversationId: React.PropTypes.string.isRequired,
    allMessagesQuery: React.PropTypes.any.isRequired,
    // updateLastMessage: React.PropTypes.func.isRequired,
  }

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
                imageUrl
              }
            }
          }
        }
      `,
      updateQuery: (previousState, {subscriptionData}) => {

        console.debug('Chat - Message received: ', previousState, subscriptionData)
        const newMessage = subscriptionData.data.Message.node
        const messages = previousState.allMessages ? previousState.allMessages.concat([newMessage]) : [newMessage]
        return {
          allMessa1ges: messages,
        }
      },
      onError: (err) => console.error('An error occured while being subscribed: ', err),
    })
  }

  componentDidUpdate(prevProps) {
    if (prevProps.allMessagesQuery.allMessages !== this.props.allMessagesQuery.allMessages && this.endRef) {
      this.endRef.scrollIntoView()
    }
  }

  render() {

    if (this.props.allMessagesQuery.loading) {
      return (
        <div
          className='loading-container'
        >
          <div
            style={{backgroundColor: global['Freecom'].mainColor || 'rgba(0,0,0,.5)'}}
            className='loading' />
        </div>
      )
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
            setEndRef={this._setEndRef}
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
    this.props.createMessageMutation({
      variables: {
        text: this.state.message,
        conversationId: this.props.conversationId,
      }
    })
  }

  _onFileDrop = async (acceptedFiles, rejectedFiles) => {
    console.debug('Accepted files: ', acceptedFiles)
    console.debug('Rejected files: ', rejectedFiles)

    // prepare form data, use data key!
    let data = new FormData()
    data.append('data', acceptedFiles[0])

    this.setState({isUploadingImage: true})

    // use the file endpoint
    const response = await fetch('https://api.graph.cool/file/v1/cizf8g3fr1sp90139ikdjayb7', {
      method: 'POST',
      body: data
    })
    this.setState({isUploadingImage: false})

    const json = await response.json()
    this.props.createMessageMutation({
      variables: {
        text: 'Uploaded image to URL: ' + json.url,
        conversationId: this.props.conversationId,
      }
    })
  }

  _setEndRef = (element) => {
    this.endRef = element
  }
}


export default compose(
  graphql(allMessages, {name: 'allMessagesQuery'}),
  graphql(createMessage, {name : 'createMessageMutation'})
)(Chat)