import React, {Component} from 'react'
import ReactDOM from 'react-dom'
import './ChatMessages.css'
import ChatMessage from './ChatMessage'

class ChatMessages extends Component {

  static propTypes = {
    messages: React.PropTypes.array.isRequired,
    secondsUntilRerender: React.PropTypes.number.isRequired,
  }

  componentDidMount() {
    this._scrollToBottom()
  }

  componentDidUpdate() {
    this._scrollToBottom()
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
