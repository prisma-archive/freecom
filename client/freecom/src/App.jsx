import React, { Component } from 'react'
import cx from 'classnames'
import './App.css'
import Chat from './Chat'
import ConversationsList from './ConversationsList'
import { graphql, compose, withApollo } from 'react-apollo'
import gql from 'graphql-tag'
import generateStupidName from 'sillyname'

const createCustomer = gql`
    mutation createCustomer($name: String!) {
        createCustomer(name: $name) {
            id
            name
        }
    }
`

const createCustomerAndConversation = gql`
    mutation createCustomer($name: String!, $slackChannelName: String!) {
        createCustomer(name: $name, conversations: [{
        slackChannelName: $slackChannelName,
        }]) {
            id
            conversations {
                id
                updatedAt
                slackChannelName
            }
        }
    }
`

const findConversations = gql`
    query allConversations($customerId: ID!) {
        allConversations(filter: {
          customer: {
            id: $customerId
          }
        }){
            id
            updatedAt
            slackChannelName
            messages(last: 1) {
                id
                text
                createdAt
                agent {
                    id
                    slackUserName
                }
            }
        }
    }
`

const createConversation = gql`
    mutation createConversation($customerId: ID!, $slackChannelName: String!) {
        createConversation(customerId: $customerId, slackChannelName: $slackChannelName) {
            id
            updatedAt
        }
    }
`

const FREECOM_CUSTOMER_ID_KEY = 'FREECOM_CUSTOMER_ID'
const FREECOM_CUSTOMER_NAME_KEY = 'FREECOM_CUSTOMER_NAME'

class App extends Component {

  state = {
    conversationId: null,
    conversations: [],
    displayState: 'CONVERSATIONS', // 'CONVERSATIONS' or 'CHAT'
    isOpen: false,
  }

  async componentDidMount() {

    // TESTING
    // localStorage.removeItem(FREECOM_CUSTOMER_ID_KEY)
    // localStorage.removeItem(FREECOM_CUSTOMER_NAME_KEY)

    const customerId = localStorage.getItem(FREECOM_CUSTOMER_ID_KEY)
    const username = localStorage.getItem(FREECOM_CUSTOMER_NAME_KEY)

    if (Boolean(customerId) && Boolean(username)) {

      // customer already exists, find all conversations for that customer
      const findConversationsResult = await this.props.client.query({
        query: findConversations,
        variables: {
          customerId
        }
      })

      this.setState({conversations: findConversationsResult.data.allConversations})

    }
    else {
      // customer doesn't exist yet, create customer and conversation
      const username = this._generateShortStupidName()
      const result = await this.props.createCustomerMutation({
        variables: {
          name: username,
        }
      })
      const customerId = result.data.createCustomer.id
      localStorage.setItem(FREECOM_CUSTOMER_ID_KEY, customerId)
      localStorage.setItem(FREECOM_CUSTOMER_NAME_KEY, username)
    }

  }

  render() {

    const customerId = localStorage.getItem(FREECOM_CUSTOMER_ID_KEY)
    const customerExists = Boolean(customerId)
    const conversationExists = Boolean(this.state.conversationId)
    const panelStyles = cx('panel drop-shadow radius overflow-hidden', {
      'hide': !this.state.isOpen,
      'fadeInUp':this.state.isOpen,
    })

    console.log('App - render - ', customerId, this.state.conversationId)

    return (
      <div className='App'>
        {!conversationExists ?
          Boolean(this.state.conversations) &&
          <div>
            <div className="container">
              <div className={panelStyles}>
                <div className="header header-padding">
                  <div className="conversation-header gutter-left">
                    <h3 className='fadeInLeft'>Conversations</h3>
                    <p className='opaque fadeInLeft'>with Graphcool</p>
                  </div>
                  <div className="mobile-button-close pointer fadeInLeft" onClick={() => this._togglePanel()}>×</div>
                </div>
                <div className="body overflow-scroll">
                  <ConversationsList
                    conversations={this.state.conversations}
                    onSelectConversation={this._onSelectConversation}
                  />
                  <div className="flex flex-hcenter full-width conversation-button-wrapper pointer-events-none">
                    <div
                      className="conversation-button background-darkgray drop-shadow-hover pointer flex-center flex pointer-events-initial"
                      onClick={() => this._createNewConversation()}
                    >
                      <p>New Conversation</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="button drop-shadow-hover pointer" onClick={() => this._togglePanel()}></div>
            </div>
          </div>
          :
          customerExists &&
          <div>

            <div className="container">
              <div className={panelStyles}>
                <div className="header flex header-padding">
                  <div className="radius fadeInLeft back-button pointer" onClick={this._resetConversation}>{'<'}</div>
                  <div className='padding-10 flex'>
                    <div className="avatar fadeInLeft"></div>
                    <div className="fadeInLeft gutter-left">
                      Name
                      <p className='fadeInLeft opaque'>Last time active</p>
                    </div>
                  </div>
                </div>
                <Chat
                  conversationId={this.state.conversationId}
                  customerId={customerId}
                  resetConversation={this._resetConversation}
                />
              </div>
              <div className="button pointer drop-shadow-hover" onClick={() => this._togglePanel()}></div>
            </div>
          </div>
        }

      </div>
    )
  }

  _togglePanel = () => this.setState({isOpen: !this.state.isOpen})

  _createNewConversation = async () => {

    const customerId = localStorage.getItem(FREECOM_CUSTOMER_ID_KEY)
    const username = localStorage.getItem(FREECOM_CUSTOMER_NAME_KEY)

    console.log('Create new conversation')
    // find channel with greatest position appended as suffix
    const channelPositions = this.state.conversations.map(conversation => {
      const slackChannelNameComponents = conversation.slackChannelName.split('-')
      return slackChannelNameComponents[slackChannelNameComponents.length-1]
    })

    console.log('Channel positions: ', channelPositions)

    let newChannelPosition = 1
    if (channelPositions.length > 0) {
      const maxPosition = Math.max.apply(null, channelPositions)
      newChannelPosition = maxPosition + 1
    }
    const newChannelName = username + '-' + newChannelPosition

    // create new conversation for the customer
    console.log('Create conversation for existing customer: ', customerId, newChannelName)
    const result = await this.props.createConversationMutation({
      variables: {
        customerId: customerId,
        slackChannelName: newChannelName
      }
    })
    const conversationId = result.data.createConversation.id
    this.setState({conversationId})
  }

  _onSelectConversation = (conversation) => {
    console.log('Selected conversation: ', conversation)
    this.setState({
      conversationId: conversation.id,
    })
  }

  _resetConversation = () => {
    this.setState({
      conversationId: null,
    })
  }

  _generateShortStupidName = () => {
    const maxLength = 17
    const username = generateStupidName()
    if (username.length > maxLength) {
      return this._generateShortStupidName()
    }
    const usernameWithoutSpace = username.replace(' ', '-')
    return usernameWithoutSpace
  }
}

const appWithMutations = compose(
  graphql(createConversation, {name : 'createConversationMutation'}),
  graphql(createCustomer, {name: 'createCustomerMutation'}),
  graphql(createCustomerAndConversation, {name: 'createCustomerAndConversationMutation'})
)(App)

export default withApollo(appWithMutations)
