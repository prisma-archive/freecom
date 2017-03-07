import React, { Component} from 'react'
import './ConversationsList.css'
import ConversationItem from './ConversationItem'

class ConversationsList extends Component {

  static propTypes = {
    onSelectConversation: React.PropTypes.func.isRequired,
  }

  render() {

    return (
      <div className='conversation-list'>
        {this.props.conversations.map((conversation, i) => {
          return (conversation.messages.length > 0 && <ConversationItem
            key={i}
            conversation={conversation}
            onSelectConversation={this.props.onSelectConversation}
          />)
        })}
      </div>
    )

  }

}

export default ConversationsList
