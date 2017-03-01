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

    console.log('Got customer Id from local storage: ', customerId)
    if (Boolean(customerId) && Boolean(username)) {

      // customer already exists, find all conversations for that customer
      const findConversationsResult = await this.props.client.query({
        query: findConversations,
        variables: {
          customerId
        }
      })

      console.log('Find conversations result: ', findConversationsResult)
      this.setState({conversations: findConversationsResult.data.allConversations})

      // // find channel with greatest position appended as suffix
      // const channelPositions = findConversationsResult.data.allConversations.map(conversation => {
      //   const slackChannelNameComponents = conversation.slackChannelName.split('-')
      //   return slackChannelNameComponents[slackChannelNameComponents.length-1]
      // })
      //
      // console.log('Channel positions: ', channelPositions)
      //
      // const maxPosition = Math.max.apply(null, channelPositions)
      // const newChannelPosition = maxPosition + 1
      // const newChannelName = username + '-' + newChannelPosition
      //
      // // create new conversation for the customer
      // console.log('Create conversation for existing customer: ', customerId, newChannelName)
      // const result = await this.props.createConversationMutation({
      //   variables: {
      //     customerId: customerId,
      //     slackChannelName: newChannelName
      //   }
      // })
      // const conversationId = result.data.createConversation.id
      // // this.setState({conversationId})
    }
    else {
      // customer doesn't exist yet, create customer and conversation
      const username = this._generateShortStupidName()
      const slackChannelName = username + '-' + '0'
      const result = await this.props.createCustomerMutation({
        variables: {
          name: username,
        }
      })
      console.log('Did create new customer: ', result.data)
      const customerId = result.data.createCustomer.id
      localStorage.setItem(FREECOM_CUSTOMER_ID_KEY, customerId)
      localStorage.setItem(FREECOM_CUSTOMER_NAME_KEY, username)
      // const conversationId = result.data.createCustomer.conversations[0].id
      // this.setState({conversationId})
    }

  }

  render() {

    const customerId = localStorage.getItem(FREECOM_CUSTOMER_ID_KEY)
    const customerExists = Boolean(customerId)
    const conversationExists = Boolean(this.state.conversationId)
    const panelStyles = cx('panel drop-shadow radius', {
      'hide': !this.state.isOpen,
      'fadeInUp':this.state.isOpen,
    })

    console.log('App - render - ', customerId, this.state.conversationId)

    return (
      <div className='App'>
        {!conversationExists ?
          Boolean(this.state.conversations) &&
          <div>
            <div
              className='CreateConversationButton'
              onClick={() => this._createNewConversation()}
            >Create new conversation</div>
            <ConversationsList
              conversations={this.state.conversations}
              onSelectConversation={this._onSelectConversation}
            />

            <div className="container">
              <div className={panelStyles}>
                <div className="header interior-padding">
                  <div className="avatar-spacer gutter-left">
                    Header
                    <p className='opaque'>subtitle goes here</p>
                  </div>
                  <div className="mobile-button drop-shadow" onClick={() => this._togglePanel()}>×</div>
                </div>
                <div className="body">
                  <ConversationsList
                    conversations={this.state.conversations}
                    onSelectConversation={this._onSelectConversation}
                  />
                  <div className="conversation-button">New Conversation</div>
                </div>
                <button onClick={() => this._createNewConversation()}>new conversation</button>
              </div>

              <div className="button drop-shadow" onClick={() => this._togglePanel()}></div>
            </div>
          </div>
          :
          customerExists &&
          <Chat
            conversationId={this.state.conversationId}
            customerId={customerId}
            resetConversation={this._resetConversation}
          />
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
