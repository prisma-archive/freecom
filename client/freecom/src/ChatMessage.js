import React, { Component} from 'react'
import './ChatMessage.css'
import {timeDifference} from './utils'

class ChatMessage extends Component {

  render() {

    const createdAtTimestamp = new Date(this.props.time).getTime()
    const nowTimestamp = new Date().getTime()
    const ago = timeDifference(nowTimestamp, createdAtTimestamp)

    const leftAlign = this.props.message.startsWith('You')

    return (
      <div className={leftAlign ? 'ChatMessageLeftAlign' : 'ChatMessageRightAlign'}>
        <div className='MessageHeader'>
          <div className='Time'>({ago})</div>
        </div>
        <div className='Message'>{this.props.message}</div>
      </div>
    )
  }

}

export default ChatMessage

ChatMessage.propTypes = {
  message: React.PropTypes.string.isRequired,
  time: React.PropTypes.string.isRequired,
}
