import React, { Component} from 'react'
import './ChatMessages.css'
import ChatMessage from './ChatMessage'

class ChatMessages extends Component {

  static propTypes = {
    messages: React.PropTypes.array.isRequired,
    setEndRef: React.PropTypes.func.isRequired,
  }

  render() {
    return (
      <div className='ChatMessages padding-v-20'>
        {this.props.messages.map((message, i) => {
          return (<ChatMessage
            key={i}
            time={message.createdAt}
            message={message.text}
            sentByAgent={message.agent}
          />)
        })}
        <div style={ {float:"left", clear: "both"} }
             ref={el => { this.props.setEndRef(el) }}></div>
      </div>
    )
  }

}

export default ChatMessages
