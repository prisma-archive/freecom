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
        className='conversation interior-padding fadeInLeft'
        onClick={() => this.props.onSelectConversation(this.props.conversation)}
      >
        <div className="flex">
          <div className="avatar"></div>
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
