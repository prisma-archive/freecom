import React, { Component} from 'react'
import './ConversationItem.css'
import {timeDifference} from './utils'

class ConversationItem extends Component {

  render() {

    const createdAtTimestamp = new Date(this.props.conversation.updatedAt).getTime()
    const nowTimestamp = new Date().getTime()
    const ago = timeDifference(nowTimestamp, createdAtTimestamp)

    return (
      <div
        className='ConversationItem'
        onClick={() => this.props.onSelectConversation(this.props.conversation)}
      >
        Last message in conversation: {ago}
      </div>
    )
  }

}

export default ConversationItem

ConversationItem.propTypes = {

}
