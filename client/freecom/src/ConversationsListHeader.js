import React, { Component} from 'react'
import './ConversationsListHeader.css'
import './App.css'

class ConversationsListHeader extends Component {

  static propTypes = {
    togglePanel: React.PropTypes.func.isRequired,
  }

  render() {
    return (
      <div
        style={{backgroundColor: global['Freecom'].mainColor}}
        className='header header-padding header-shadow'
      >
        <div className='conversation-header gutter-left'>
          <h3 className='fadeInLeft'>Conversations</h3>
          <p className='text-opaque fadeInLeft'>with {global['Freecom'].companyName}</p>
        </div>
        <div className='mobile-button-close pointer fadeInLeft' onClick={() => this.props.togglePanel()}>×</div>
      </div>
    )

  }

}

export default ConversationsListHeader
