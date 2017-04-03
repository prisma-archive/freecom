import React, { Component} from 'react'
import './ChatHeader.css'
import './App.css'
import gql from 'graphql-tag'
import { graphql } from 'react-apollo'
import { timeDifferenceForDate } from '../utils'

const lastMessageOfCurrentAgent = gql`
  query lastMessageOfCurrentAgent($agentId: ID!) {
    Agent(id: $agentId) {
      id
      messages(last: 1) {
        id
        createdAt
      }
    }
  }
`

const newMessageSubscription = gql`
  subscription Message {
    Message(filter: {
      mutation_in: [CREATED]
    }) {
      node {
        id
        agent {
          id
          slackUserName
          imageUrl
          messages(last: 1) {
            id
            createdAt
          }
        }
      }
    }
  }
`

class ChatHeader extends Component {

  static propTypes = {
    resetConversation: React.PropTypes.func.isRequired,
    chatPartnerName: React.PropTypes.string.isRequired,
    profileImageUrl: React.PropTypes.string.isRequired,
    headerColor: React.PropTypes.string.isRequired,
    created: React.PropTypes.string,
    agentId: React.PropTypes.string,
    shouldDisplayBackButton: React.PropTypes.bool,
  }

  componentDidMount() {
    if (this.props.lastMessageOfCurrentAgentQuery) {
      this.props.lastMessageOfCurrentAgentQuery.subscribeToMore({
        document: newMessageSubscription,
        updateQuery: (previousState, {subscriptionData}) => {
          const newMessage = subscriptionData.data.Message.node
          if (!newMessage.agent) {
            return previousState
          }
          return {
            lastMessageOfCurrentAgent: newMessage.agent
          }
        }
      })
    }
  }

  render() {
    const headerSubtitle = this._generateHeaderSubtitle()
    return (
      <div
        style={{backgroundColor: this.props.headerColor}}
        className='header flex header-padding-chat items-center header-shadow'
      >
        {this.props.shouldDisplayBackButton &&
          <div className='radius fadeInLeft flex flex-center back-button pointer' onClick={this.props.resetConversation}>
            <i className='material-icons'>keyboard_arrow_left</i>
          </div>
        }
        <div className='padding-10 flex'>
          <img
            src={this.props.profileImageUrl}
            alt=''
            className='avatar fadeInLeft'></img>
          <div className='fadeInLeft gutter-left conversation-title'>
            {this.props.chatPartnerName}
            <p className='fadeInLeft text-opaque'>{headerSubtitle}</p>
          </div>
        </div>
      </div>
    )
  }

  _generateHeaderSubtitle = () => {
    let headerSubtitle = ''
    if (this.props.lastMessageOfCurrentAgentQuery && !this.props.lastMessageOfCurrentAgentQuery.loading) {
      const lastMessage = this.props.lastMessageOfCurrentAgentQuery.Agent.messages[0]
      headerSubtitle = 'Last active ' + timeDifferenceForDate(lastMessage.createdAt)
    } else {
      headerSubtitle = 'Created '  + this.props.created
    }
    return headerSubtitle
  }

}

export default graphql(lastMessageOfCurrentAgent, {
  skip: (ownProps) => {
    return !Boolean(ownProps.agentId)
  },
  name: "lastMessageOfCurrentAgentQuery"
})(ChatHeader)
