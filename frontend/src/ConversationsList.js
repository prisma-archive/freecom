import React, { Component} from 'react'
import './ConversationsList.css'
import ConversationItem from './ConversationItem'

const INITIAL_SECONDS_UNTIL_RERENDER = 2

class ConversationsList extends Component {

  static propTypes = {
    onSelectConversation: React.PropTypes.func.isRequired,
  }

  _timer = null

  state = {
    secondsUntilRerender: INITIAL_SECONDS_UNTIL_RERENDER,
  }

  // componentDidMount() {
  //   this._rerender()
  // }
  //
  // componentWillUnmount() {
  //   clearTimeout(this._timer)
  // }

  render() {

    // console.log('ConversationsList - render: ', this.state.secondsUntilRerender)

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

  // _rerender = () => {
  //   console.log('ConversationsList - _rerender: ', this.state.secondsUntilRerender)
  //   this.setState(
  //     { secondsUntilRerender: this.state.secondsUntilRerender * 2 },
  //     () => {
  //       this._timer = setTimeout(this._rerender, this.state.secondsUntilRerender * 1000)
  //     }
  //   )
  // }

}

export default ConversationsList
