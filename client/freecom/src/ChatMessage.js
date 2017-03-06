import React, { Component } from 'react'
import './ChatMessage.css'
import { timeDifference } from './utils'

class ChatMessage extends Component {

  static propTypes = {
    message: React.PropTypes.string.isRequired,
    time: React.PropTypes.string.isRequired,
    sentByAgent: React.PropTypes.any,
  }

  render() {

    const createdAtTimestamp = new Date(this.props.time).getTime()
    const nowTimestamp = new Date().getTime()
    const ago = timeDifference(nowTimestamp, createdAtTimestamp)

    return (
    <div className='fadeInLeft'>

      <div style={{display: this.props.sentByAgent ? 'visible' : 'none'}} className='message-padding'>
        <div className='flex flex-bottom'>
          <div className='avatar message-avatar'></div>
          <div className='message-container message-container-padding-left'>
            <div className='opaque background-gray padding-20 radius opaque'>
              <p>{this.props.message}</p>
            </div>
            <p className='right opacity-4'>{ago}</p>
          </div>
        </div>
      </div>

      <div style={{display: !this.props.sentByAgent ? 'visible' : 'none'}} className='message-padding'>
        <div className='flex flex-bottom'>
          <div className='message-container message-container-padding-right flex-right'>
            <div className='opaque background-blue white padding-20 radius opaque'>
              <p>{this.props.message}</p>
            </div>
            <p className='right opacity-4'>{ago}</p>
          </div>
        </div>
      </div>

    </div>
    )

  }

}

export default ChatMessage
