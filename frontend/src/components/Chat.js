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

const newMessageSubscription =  gql`
  subscription newMessageSubscription($conversationId: ID!) {
    Message(filter: {
      AND: [{
        mutation_in: [CREATED]
      }, {
        node: {
          conversation: {
            id: $conversationId
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
`

class Chat extends Component {

  static propTypes = {
    conversationId: React.PropTypes.string.isRequired,
    allMessagesQuery: React.PropTypes.any.isRequired,
    secondsUntilRerender: React.PropTypes.number.isRequired,
    mainColor: React.PropTypes.string.isRequired,
    profileImageURL: React.PropTypes.string.isRequired,
  }

  _timer = null

  state = {
    message: '',
    isUploadingImage: false,
  }

  componentDidMount() {
    this._subscribeToNewMessages(this)
    this._rerender()
  }

  componentWillUnmount() {
    clearTimeout(this._timer)
  }

  render() {

    if (this.props.allMessagesQuery.loading) {
      return (
        <div
          className='loading-container'
        >
          <div
            style={{backgroundColor: this.props.mainColor || 'rgba(0,0,0,.5)'}}
            className='loading' />
        </div>
      )
    }

    return (
      <Dropzone
        className='dropzone relative'
        onDrop={this._onFileDrop}
        accept='image/*'
        multiple={false}
        disableClick={true}
      >
        <div className='message-body chat-container'>
          <ChatMessages
            messages={this.props.allMessagesQuery.allMessages || []}
            secondsUntilRerender={this.props.secondsUntilRerender}
            userSpeechBubbleColor={this.props.mainColor}
            profileImageURL={this.props.profileImageURL}
          />
          {this.state.isUploadingImage && <div className='upload-image-indicator'>Uploading image ...</div>}
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

  _subscribeToNewMessages = (componentRef) => {
    this.newMessageSubscription = this.props.allMessagesQuery.subscribeToMore({
      document: newMessageSubscription,
      updateQuery: (previousState, {subscriptionData}) => {
        const newMessage = subscriptionData.data.Message.node
        const messages = previousState.allMessages ? previousState.allMessages.concat([newMessage]) : [newMessage]
        return {
          allMessages: messages,
        }
      },
      variables: {
        conversationId: this.props.conversationId
      },
      onError: (err) => {
        console.error('Chat - An error occured while being subscribed: ', err, 'Subscribe again')
        componentRef._subscribeToNewMessages(componentRef)
      }
    })

  }

  _rerender = () => {
    this.forceUpdate()
    this._timer = setTimeout(this._rerender, this.props.secondsUntilRerender * 1000)
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
    // prepare form data, use data key!
    const data = new FormData()
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

}

export default compose(
  graphql(allMessages, {name: 'allMessagesQuery'}),
  graphql(createMessage, {name : 'createMessageMutation'})
)(Chat)
