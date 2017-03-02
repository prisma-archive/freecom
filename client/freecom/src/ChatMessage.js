import React, { Component} from 'react'
import './ChatMessage.css'
import {timeDifference} from './utils'

class ChatMessage extends Component {

  render() {

    const createdAtTimestamp = new Date(this.props.time).getTime()
    const nowTimestamp = new Date().getTime()
    const ago = timeDifference(nowTimestamp, createdAtTimestamp)

    const messagePrefix = Boolean(this.props.sentByAgent) ? this.props.sentByAgent.slackUserName + ': ' : 'You: '

    return (
    <div className='fadeInLeft'>
      <div style={{display: !this.props.sentByAgent ? 'visible' : 'none'}} className='padding-10'>
        <div className='flex flex-bottom'>
          <div className="avatar message-avatar"></div>
          <div className='message-container'>
            <div className='opaque background-gray padding-20 radius opaque'>
              <p>{this.props.message}</p>
            </div>
            <p className='right opacity-4'>{ago}</p>
          </div>
        </div>
      </div>

      <div style={{display: this.props.sentByAgent ? 'visible' : 'none'}} className='interior-padding'>
        <div className='background-gray'>
          <div className="avatar"></div>
          <div className='opaque'>
            {messagePrefix + this.props.message}
            ({ago})
          </div>
        </div>
      </div>

    </div>
    )

  }

}

export default ChatMessage

ChatMessage.propTypes = {
  message: React.PropTypes.string.isRequired,
  time: React.PropTypes.string.isRequired,
}
