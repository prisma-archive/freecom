import React, { Component} from 'react'
import './ChatHeader.css'
import './App.css'

class ChatHeader extends Component {

  static propTypes = {
    resetConversation: React.PropTypes.func.isRequired,
    chatPartnerName: React.PropTypes.string.isRequired,
    profileImageUrl: React.PropTypes.string.isRequired
  }

  render() {


    return (
      <div
        style={{backgroundColor: global['Freecom'].mainColor}}
        className='header flex header-padding-chat items-center'
      >
        <div className='radius fadeInLeft flex flex-center back-button pointer' onClick={this.props.resetConversation}>
          <i className='material-icons'>keyboard_arrow_left</i>
        </div>
        <div className='padding-10 flex'>
          <img
            src={this.props.profileImageUrl}
            alt=''
            className='avatar fadeInLeft'></img>
          <div className='fadeInLeft gutter-left conversation-title'>
            {this.props.chatPartnerName}
            <p className='fadeInLeft text-opaque'>Last time active</p>
          </div>
        </div>
      </div>
    )

  }

}

export default ChatHeader
