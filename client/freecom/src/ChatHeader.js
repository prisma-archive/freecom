import React, { Component} from 'react'
import './ChatHeader.css'
import './App.css'

class ChatHeader extends Component {

  render() {
    return (
      <div className="header flex header-padding">
        <div className="radius fadeInLeft back-button pointer" onClick={this.props.resetConversation}>{'<'}</div>
        <div className='padding-10 flex'>
          <div className="avatar fadeInLeft"></div>
          <div className="fadeInLeft gutter-left">
            {this.props.agentName}
            <p className='fadeInLeft opaque'>Last time active</p>
          </div>
        </div>
      </div>
    )

  }

}

export default ChatHeader
