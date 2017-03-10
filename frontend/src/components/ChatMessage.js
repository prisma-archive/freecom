import React, { Component } from 'react'
import './ChatMessage.css'
import { timeDifferenceForDate } from '../utils'

class ChatMessage extends Component {

  static propTypes = {
    message: React.PropTypes.any.isRequired,
  }

  render() {
  const {agent} = this._generateChatMessageInfo()
  return (
      <div className='fadeInLeft'>
        {agent ? this._renderAgentMessage() : this._renderOwnMessage()}
      </div>
    )
  }

  _renderOwnMessage = () => {
    const {ago, textWithLineBreaks} = this._generateChatMessageInfo()
    return (
      <div className='message-padding'>
        <div className='flex flex-bottom'>
          <div className='message-container message-container-padding-right flex-right'>
            <div
              style={{backgroundColor: global['Freecom'].mainColor}}
              className='white padding-20 radius background-blue'>
              <p>{textWithLineBreaks}</p>
            </div>
            <p className='right opacity-4 padding-top-2'>{ago}</p>
          </div>
        </div>
      </div>
    )
  }

  _renderAgentMessage = () => {
    const {ago, profileImageUrl, textWithLineBreaks} = this._generateChatMessageInfo()
    return (
      <div className='message-padding'>
        <div className='flex flex-bottom'>
          <img
            src={profileImageUrl}
            alt=''
            className='avatar message-avatar'></img>
          <div className='message-container message-container-padding-left'>
            <div className='opaque background-gray padding-20 radius opaque'>
              <p>{textWithLineBreaks}</p>
            </div>
            <p className='right opacity-4 padding-top-2'>{ago}</p>
          </div>
        </div>
      </div>
    )
  }

  _generateChatMessageInfo = () => {
    const ago = timeDifferenceForDate(this.props.message.createdAt)
    const agent = this.props.message.agent
    const profileImageUrl = agent && agent.imageUrl ? agent.imageUrl : global['Freecom'].companyLogoURL
    const textWithLineBreaks = this.props.message.text.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ))
    return {ago, agent, profileImageUrl, textWithLineBreaks}
  }

}

export default ChatMessage
