import React, { Component} from 'react'
import './ConversationsList.css'
import ChatMessage from './ChatMessage'

class ConversationsList extends Component {

  render() {
    return (
      <div className='ConversationsList'>
        {this.props.messages.map((message, i) => {
          return (<ChatMessage
            key={i}
            time={message.createdAt}
            message={message.text}
          />)
        })}
      </div>
    )
  }

}

export default ConversationsList

ConversationsList.propTypes = {

}
