import React, { Component } from 'react'
import cx from 'classnames'
import './App.css'
import Chat from './Chat'
import ChatHeader from './ChatHeader'
import ConversationsList from './ConversationsList'
import ConversationsListHeader from './ConversationsListHeader'
import ToggleOpeningStateButton from './ToggleOpeningStateButton'
import { graphql, compose, withApollo } from 'react-apollo'
import gql from 'graphql-tag'
import { timeDifferenceForDate, sortConversationByDateCreated, generateShortStupidName } from './utils'

const TEST_WITH_NEW_CUSTOMER = false
const FREECOM_CUSTOMER_ID_KEY = 'FREECOM_CUSTOMER_ID'
const FREECOM_CUSTOMER_NAME_KEY = 'FREECOM_CUSTOMER_NAME'

const createCustomer = gql`
  mutation createCustomer($name: String!) {
    createCustomer(name: $name) {
      id
      name
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
      slackChannelIndex
      agent {
        id
        slackUserName
        imageUrl
      }
      messages(last: 1) {
        id
        text
        createdAt
      }
    }
  }
`

const createConversation = gql`
  mutation createConversation($customerId: ID!, $slackChannelName: String!, $slackChannelIndex: Int!) {
    createConversation(customerId: $customerId, slackChannelName: $slackChannelName, slackChannelIndex: $slackChannelIndex) {
      id
      updatedAt
      slackChannelName
      slackChannelIndex
      agent {
        id
        slackUserName
        imageUrl
      }
      messages(last: 1) {
        id
        text
        createdAt
      }
    }
  }
`

const newMessageSusbcription = gql`
  subscription {
    Message(filter: {
    mutation_in: [CREATED]
    }) {
      node {
        id
        text
        createdAt
        conversation {
          id
          updatedAt
          slackChannelName
          slackChannelIndex
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
  }
`

const INITIAL_SECONDS_UNTIL_RERENDER = 8

class App extends Component {

  _timer = null

  state = {
    isOpen: true,
    selectedConversationId: null,
    conversations: [],
    secondsUntilRerender: INITIAL_SECONDS_UNTIL_RERENDER,
  }

  async componentDidMount() {

    // TESTING
    if (TEST_WITH_NEW_CUSTOMER) {
      localStorage.removeItem(FREECOM_CUSTOMER_ID_KEY)
      localStorage.removeItem(FREECOM_CUSTOMER_NAME_KEY)
    }

    // retrieve customer data
    const customerId = localStorage.getItem(FREECOM_CUSTOMER_ID_KEY)
    const username = localStorage.getItem(FREECOM_CUSTOMER_NAME_KEY)

    if (Boolean(customerId) && Boolean(username)) {
      // customer already exists, find all conversations for that customer
      this._loadConversations(customerId)
    } else {
      // customer doesn't exist yet, create customer and conversation
      this._setupNewCustomer()
    }

    // subscribe to new messages
    this._subscribeToNewMessages(this)

    // start periodic rerender
    this._rerender()
  }

  componentWillUnmount() {
    clearTimeout(this._timer)
  }

  render() {
    const customerId = localStorage.getItem(FREECOM_CUSTOMER_ID_KEY)
    const selectedConversation = Boolean(this.state.selectedConversationId)
    const panelStyles = cx(`panel drop-shadow radius overflow-hidden ${this.state.isOpen ? 'fadeInUp' : 'hide'}`)
    return (
      <div className='App'>
        <div>
          <div className='container'>
            <div className={panelStyles}>
              {selectedConversation && customerId ? this._renderChat(customerId) : this._renderConversationsList()}
            </div>
            <ToggleOpeningStateButton
              isOpen={this.state.isOpen}
              togglePanel={this._togglePanel}
            />
          </div>
        </div>
      </div>
    )
  }

  _renderConversationsList = () => {
    return (
      <span>
        <ConversationsListHeader />
        <div className='body overflow-y-scroll overflow-x-hidden'>
          <ConversationsList
            conversations={this.state.conversations}
            onSelectConversation={this._onSelectConversation}
          />
          <div className='flex flex-hcenter full-width conversation-button-wrapper pointer-events-none'>
            <div
              className='conversation-button background-darkgray drop-shadow-hover pointer flex-center flex pointer-events-initial'
              onClick={() => this._initiateNewConversation()}
            >
              <p>New Conversation</p>
            </div>
          </div>
        </div>
      </span>
    )
  }

  _renderChat = (customerId) => {
    const selectedConversation = this.state.conversations.find(c => c.id === this.state.selectedConversationId)
    const { agent } = selectedConversation
    const chatPartnerName = agent ? selectedConversation.agent.slackUserName : global['Freecom'].companyName
    const profileImageUrl = agent && agent.imageUrl ? agent.imageUrl : global['Freecom'].companyLogoURL
    const created = timeDifferenceForDate(selectedConversation.updatedAt)
    return (
      <span>
        <ChatHeader
          chatPartnerName={chatPartnerName}
          agentId={selectedConversation.agent ? selectedConversation.agent.id : null}
          resetConversation={this._resetConversation}
          profileImageUrl={profileImageUrl}
          created={created}
        />
        <Chat
          conversationId={this.state.selectedConversationId}
          customerId={customerId}
          resetConversation={this._resetConversation}
          secondsUntilRerender={this.state.secondsUntilRerender}
        />
      </span>
    )
  }

  _subscribeToNewMessages = (componentRef) => {
    this.newMessageObserver = this.props.client.subscribe({
      query: newMessageSusbcription,
    }).subscribe({
      next: this._handleNewMessage,
      error(error) {
        console.error('App - Subscription callback with error: ', error, 'Subscribe again')
        componentRef._subscribeToNewMessages(componentRef)
      },
    })
  }

  _handleNewMessage = (data) => {
    const conversationOfNewMessage = data.Message.node.conversation
    const newConversations = this.state.conversations.slice()
    const indexOfConversationToUpdate = newConversations.findIndex(conversation =>
      conversation.id === conversationOfNewMessage.id
    )
    newConversations[indexOfConversationToUpdate] = conversationOfNewMessage

    clearTimeout(this._timer)
    this.setState({
      secondsUntilRerender: INITIAL_SECONDS_UNTIL_RERENDER,
      conversations: newConversations
    },
      () => this._rerender()
    )
    this._updateLastMessageInConversation(data.Message.node.conversation.id, data.Message.node)
  }

  _setupNewCustomer = async () => {
    const username = this._generateShortStupidName(17)
    const result = await this.props.createCustomerMutation({
      variables: {
        name: username,
      }
    })
    const customerId = result.data.createCustomer.id
    localStorage.setItem(FREECOM_CUSTOMER_ID_KEY, customerId)
    localStorage.setItem(FREECOM_CUSTOMER_NAME_KEY, username)
  }

  _loadConversations = async (customerId) => {
    const findConversationsResult = await this.props.client.query({
      query: findConversations,
      variables: {
        customerId
      }
    })
    const sortedConversations = findConversationsResult.data.allConversations.slice()
    sortedConversations.sort(sortConversationByDateCreated)
    this.setState({conversations: sortedConversations})
  }

  _updateLastMessageInConversation = (conversationId, newLastMessage) => {
    const newConversations = this.state.conversations.slice()
    const indexOfConversationToUpdate = newConversations.findIndex(c => c.id === conversationId)
    const newConversation = {
      ...newConversations[indexOfConversationToUpdate],
      messages: [newLastMessage]
    }

    // remove conversation
    newConversations.splice(indexOfConversationToUpdate, 1)

    // and insert it in first position
    newConversations.splice(0, 0, newConversation)

    this.setState({conversations: newConversations})
  }

  _initiateNewConversation = () => {
    const customerId = localStorage.getItem(FREECOM_CUSTOMER_ID_KEY)
    const username = localStorage.getItem(FREECOM_CUSTOMER_NAME_KEY)
    const emptyConversation = this.state.conversations.find(c => c.messages.length === 0)
    if (Boolean(emptyConversation)) {
      this.setState({selectedConversationId: emptyConversation.id})
    } else {
      this._createNewConversation(customerId, username)
    }
  }

  _createNewConversation = async (customerId, username) => {

    // find channel with greatest position appended as suffix
    const channelPositions = this.state.conversations.map(c => c.slackChannelIndex)
    const newChannelPosition = channelPositions.length === 0 ? 1 : Math.max.apply(null, channelPositions) + 1
    const newChannelName = (username + '-' + newChannelPosition).toLowerCase()

    // create new conversation for the customer
    console.debug('Create conversation for existing customer: ', customerId, newChannelName, newChannelName)
    const result = await this.props.createConversationMutation({
      variables: {
        customerId: customerId,
        slackChannelName: newChannelName,
        slackChannelIndex: newChannelPosition,
      }
    })
    const conversationId = result.data.createConversation.id
    const newConversations = this.state.conversations.concat([result.data.createConversation])
    this.setState({
      conversations: newConversations,
      selectedConversationId: conversationId,
    })
  }

  _onSelectConversation = (conversation) => {
    console.debug('Selected conversation: ', conversation, conversation.id)
    this.setState({
      selectedConversationId: conversation.id,
    })
  }

  _resetConversation = () => {
    this.setState({
      selectedConversationId: null,
    })
  }

  _rerender = () => {
    this.setState(
      { secondsUntilRerender: this.state.secondsUntilRerender * 2 },
      () => {
        this._timer = setTimeout(this._rerender, this.state.secondsUntilRerender * 1000)
      }
    )
  }

  _togglePanel = () => this.setState({isOpen: !this.state.isOpen})

}

const appWithMutations = compose(
  graphql(createConversation, {name : 'createConversationMutation'}),
  graphql(createCustomer, {name: 'createCustomerMutation'}),
)(App)

export default withApollo(appWithMutations)
