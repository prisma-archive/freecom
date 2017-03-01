import React, { Component} from 'react'
import './ConversationItem.css'
import {timeDifference} from './utils'

class ConversationItem extends Component {

  render() {

    const lastMessage = this.props.conversation.messages[0]
    let ago
    let message
    if(lastMessage) {
      const createdAtTimestamp = new Date(lastMessage.createdAt).getTime()
      const nowTimestamp = new Date().getTime()
      ago = timeDifference(nowTimestamp, createdAtTimestamp)
      message = lastMessage.text
    }
    else {
      const createdAtTimestamp = new Date(this.props.conversation.updatedAt).getTime()
      const nowTimestamp = new Date().getTime()
      ago = ''
      message = 'Start a new conversation'
    }

    return (
      <div
        className='conversation interior-padding fadeInLeft'
        onClick={() => this.props.onSelectConversation(this.props.conversation)}
      >
        <div className="flex">
          <div className="avatar"></div>
          <div>{message}</div>
          <div className="full-width">
            <p className='right opaque'>{ago}</p>
          </div>
        </div>
      </div>
    )
  }

}

export default ConversationItem

ConversationItem.propTypes = {

}
