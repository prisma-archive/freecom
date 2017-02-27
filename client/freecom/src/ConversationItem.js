import React, { Component} from 'react'
import './ConversationItem.css'

class ConversationItem extends Component {

  render() {
    return (
      <div
        className='ConversationItem'
        onClick={() => this.props.onSelectConversation(this.props.conversation)}
      >
        {this.props.conversation.updatedAt}
      </div>
    )
  }

}

export default ConversationItem

ConversationItem.propTypes = {

}
