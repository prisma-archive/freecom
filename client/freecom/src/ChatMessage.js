import React, { Component } from 'react'
import './ChatMessage.css'
import { timeDifference } from './utils'

class ChatMessage extends Component {

  static propTypes = {
    message: React.PropTypes.any.isRequired,
  }

  render() {

    const createdAtTimestamp = new Date(this.props.message.createdAt).getTime()
    const nowTimestamp = new Date().getTime()
    const ago = timeDifference(nowTimestamp, createdAtTimestamp)

    const agent = this.props.message.agent
    const profileImageUrl = agent && agent.imageUrl ? agent.imageUrl : global['Freecom'].companyLogoURL

    return (
    <div className='fadeInLeft'>

      <div style={{display: this.props.message.agent ? 'visible' : 'none'}} className='message-padding'>
        <div className='flex flex-bottom'>
          <img
            src={profileImageUrl}
            alt=''
            className='avatar message-avatar'></img>
          <div className='message-container message-container-padding-left'>
            <div className='opaque background-gray padding-20 radius opaque'>
              <p>{this.props.message.text}</p>
            </div>
            <p className='right opacity-4 padding-top-2'>{ago}</p>
          </div>
        </div>
      </div>

      <div style={{display: !this.props.message.agent ? 'visible' : 'none'}} className='message-padding'>
        <div className='flex flex-bottom'>
          <div className='message-container message-container-padding-right flex-right'>
            <div
              style={{backgroundColor: global['Freecom'].mainColor}}
              className='white padding-20 radius background-blue'>
              <p>{this.props.message.text}</p>
            </div>
            <p className='right opacity-4 padding-top-2'>{ago}</p>
          </div>
        </div>
      </div>

    </div>
    )

  }

}

export default ChatMessage
