import React, { Component} from 'react'
import './ChatHeader.css'
import './App.css'

class ChatHeader extends Component {

  static propTypes = {
    resetConversation: React.PropTypes.func.isRequired,
    chatPartnerName: React.PropTypes.string.isRequired,
  }

  render() {
    return (
      <div className='header flex header-padding'>
        <div className='radius fadeInLeft back-button pointer' onClick={this.props.resetConversation}>{'<'}</div>
        <div className='padding-10 flex'>
          <div className='avatar fadeInLeft'></div>
          <div className='fadeInLeft gutter-left'>
            {this.props.chatPartnerName}
            <p className='fadeInLeft opaque'>Last time active</p>
          </div>
        </div>
      </div>
    )

  }

}

export default ChatHeader
