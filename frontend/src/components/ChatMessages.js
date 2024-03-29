import React, {Component} from 'react'
import ReactDOM from 'react-dom'
import './ChatMessages.css'
import ChatMessage from './ChatMessage'

class ChatMessages extends Component {

  static propTypes = {
    messages: React.PropTypes.array.isRequired,
    secondsUntilRerender: React.PropTypes.number.isRequired,
    profileImageURL: React.PropTypes.string.isRequired,
    userSpeechBubbleColor: React.PropTypes.string.isRequired,
  }

  componentDidMount() {
    this._scrollToBottom()
  }

  componentDidUpdate() {
    this._scrollToBottom()
  }

  render() {
    return (
      <div className='chat-messages-container'>
        {this.props.messages.map((message, i) => {
          const isLatestMessage = i === this.props.messages.length - 1
          return (<ChatMessage
            key={i}
            message={message}
            shouldRenderTimestamp={isLatestMessage}
            profileImageURL={this.props.profileImageURL}
            userSpeechBubbleColor={this.props.userSpeechBubbleColor}
          />)
        })}
        { /* invisible element required for automatic scrolling to bottom */ }
        <div style={ {float:'left', clear: 'both'} } ref={el => { this._messagesEnd = el }}></div>
      </div>
    )
  }

  _scrollToBottom = () => {
    const node = ReactDOM.findDOMNode(this._messagesEnd)
    node.scrollIntoView({behavior: 'smooth'})
  }

}

export default ChatMessages
