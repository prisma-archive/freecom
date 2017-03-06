import React, { Component} from 'react'
import './ConversationsListHeader.css'
import './App.css'

class ConversationsListHeader extends Component {

  render() {
    return (
      <div className="header header-padding">
        <div className="conversation-header gutter-left">
          <h3 className='fadeInLeft'>Conversations</h3>
          <p className='opaque fadeInLeft'>with {global['Freecom'].companyName}</p>
        </div>
        <div className="mobile-button-close pointer fadeInLeft" onClick={() => this.props.togglePanel()}>×</div>
      </div>
    )

  }

}

export default ConversationsListHeader
