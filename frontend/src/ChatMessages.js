import React, { Component} from 'react'
import './ChatMessages.css'
import ChatMessage from './ChatMessage'

class ChatMessages extends Component {

  static propTypes = {
    messages: React.PropTypes.array.isRequired,
    setEndRef: React.PropTypes.func.isRequired,
    secondsUntilRerender: React.PropTypes.number.isRequired,
  }

  render() {

    return (
      <div className='ChatMessages padding-v-20'>
        {this.props.messages.map((message, i) => {
          return (<ChatMessage
            key={i}
            message={message}
          />)
        })}
        <div style={ {float:"left", clear: "both"} }
             ref={el => { this.props.setEndRef(el) }}></div>
      </div>
    )
  }

}

export default ChatMessages
