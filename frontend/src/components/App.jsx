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
import { timeDifferenceForDate, sortConversationByDateCreated, generateShortStupidName } from '../utils'
import {TEST_WITH_NEW_CUSTOMER, FREECOM_CUSTOMER_ID_KEY, FREECOM_CUSTOMER_NAME_KEY,
  MAX_USERNAME_LENGTH, INITIAL_SECONDS_UNTIL_RERENDER, AUTH_TOKEN_KEY} from '../constants'

const createCustomerAndFirstConversation = gql`
  mutation createCustomer($name: String!) {
    createCustomer(name: $name, conversations: [
      {
        slackChannelIndex: 1,
      }
    ]) {
      id
      name
      conversations {
        id
        updatedAt
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
  }
`

const authenticateCustomer = gql`
  mutation AuthenticateCustomer($name: String!) {
    authenticateAnonymousAuthenticated(secret: $name) {
      token
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
  mutation createConversation($customerId: ID!, $slackChannelIndex: Int!) {
    createConversation(
    customerId: $customerId, 
    slackChannelIndex: $slackChannelIndex) {
      id
      updatedAt
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

const newMessageSubscription = gql`
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
          messages(last: 1) {
            id
            text
            createdAt
          }
        }
      }
    }
  }
`


class App extends Component {

  _timer = null

  state = {
    isOpen: false,
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

    const customerId = localStorage.getItem(FREECOM_CUSTOMER_ID_KEY)
    const username = localStorage.getItem(FREECOM_CUSTOMER_NAME_KEY)

    if (customerId && username) {
      // customer already exists, find all conversations for that customer
      this._loadConversations(customerId)
    } else {
      // customer doesn't exist yet, create new
      this._setupNewCustomer()
    }

    this._subscribeToNewMessages(this)

    // start periodic rerender
    this._rerender()
  }

  componentWillUnmount() {
    clearTimeout(this._timer)
  }

  render() {
    const customerId = localStorage.getItem(FREECOM_CUSTOMER_ID_KEY)
    const shouldRenderChat = this.state.selectedConversationId && customerId
    const panelStyles = cx(`panel drop-shadow radius overflow-hidden ${this.state.isOpen ? 'fadeInUp' : 'hide'}`)
    return (
      <div className='App'>
        <div>
          <div className='container'>
            <div className={panelStyles}>
              {shouldRenderChat ? this._renderChat(customerId) : this._renderConversationsList()}
            </div>
            <ToggleOpeningStateButton
              isOpen={this.state.isOpen}
              togglePanel={this._togglePanel}
              mainColor={this.props.freecom.mainColor}
            />
          </div>
        </div>
      </div>
    )
  }

  _renderConversationsList = () => {
    return (
      <span>
        <ConversationsListHeader
          mainColor={this.props.freecom.mainColor}
          companyName={this.props.freecom.companyName}
        />
        <div className='body overflow-y-scroll overflow-x-hidden'>
          <ConversationsList
            conversations={this.state.conversations}
            onSelectConversation={this._onSelectConversation}
            companyLogoURL={this.props.freecom.companyLogoURL}
            companyName={this.props.freecom.companyName}
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
    const {freecom} = this.props
    const selectedConversation = this.state.conversations.find(c => c.id === this.state.selectedConversationId)
    const { agent } = selectedConversation
    const chatPartnerName = agent ? selectedConversation.agent.slackUserName : freecom.companyName
    const profileImageUrl = agent && agent.imageUrl ? agent.imageUrl : freecom.companyLogoURL
    const created = timeDifferenceForDate(selectedConversation.updatedAt)
    return (
      <span>
        <ChatHeader
          chatPartnerName={chatPartnerName}
          agentId={selectedConversation.agent ? selectedConversation.agent.id : null}
          headerColor={freecom.mainColor}
          resetConversation={this._resetConversation}
          profileImageUrl={profileImageUrl}
          created={created}
          shouldDisplayBackButton={selectedConversation.messages.length > 0}
        />
        <Chat
          conversationId={this.state.selectedConversationId}
          mainColor={freecom.mainColor}
          customerId={customerId}
          resetConversation={this._resetConversation}
          secondsUntilRerender={this.state.secondsUntilRerender}
          profileImageURL={freecom.companyLogoURL}
        />
      </span>
    )
  }

  _subscribeToNewMessages = (componentRef) => {
    this.newMessageObserver = this.props.client.subscribe({
      query: newMessageSubscription,
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
    const indexOfConversationToUpdate = newConversations.findIndex(c => c.id === conversationOfNewMessage.id)
    newConversations[indexOfConversationToUpdate] = conversationOfNewMessage
    newConversations.sort(sortConversationByDateCreated)

    // reset timer for periodic rerender
    clearTimeout(this._timer)
    this.setState(
      {
        conversations: newConversations,
        secondsUntilRerender: INITIAL_SECONDS_UNTIL_RERENDER,
      },
      () => this._rerender()
    )
  }

  _setupNewCustomer = async () => {
    const username = generateShortStupidName(MAX_USERNAME_LENGTH)
    const result = await this.props.createCustomerAndFirstConversationMutation({
      variables: {
        name: username,
      }
    })
    const customerId = result.data.createCustomer.id
    localStorage.setItem(FREECOM_CUSTOMER_ID_KEY, customerId)
    localStorage.setItem(FREECOM_CUSTOMER_NAME_KEY, username)
    const authenticationResult = await this.props.authenticateCustomerMutation({
      variables: {
        name: username
      }
    })
    const authToken = authenticationResult.data.authenticateAnonymousAuthenticated.token
    localStorage.setItem(AUTH_TOKEN_KEY, authToken)
    this.setState({
      conversations: result.data.createCustomer.conversations,
      selectedConversationId: result.data.createCustomer.conversations[0].id
    })
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

    const shouldOpenEmptyConversation =
      sortedConversations.length === 1 && sortedConversations[0].messages.length === 0

    this.setState({
      conversations: sortedConversations,
      selectedConversationId: shouldOpenEmptyConversation ? sortedConversations[0].id : null
    })
  }

  _initiateNewConversation = () => {
    const customerId = localStorage.getItem(FREECOM_CUSTOMER_ID_KEY)
    const username = localStorage.getItem(FREECOM_CUSTOMER_NAME_KEY)
    const emptyConversation = this.state.conversations.find(c => c.messages.length === 0)
    if (emptyConversation) {
      this.setState({selectedConversationId: emptyConversation.id})
    } else {
      this._createNewConversation(customerId, username)
    }
  }

  _createNewConversation = async (customerId, username) => {
    const channelPositions = this.state.conversations.map(c => c.slackChannelIndex)
    const newChannelPosition = channelPositions.length === 0 ? 1 : Math.max.apply(null, channelPositions) + 1

    // create new conversation for the customer
    console.debug('Create conversation for existing customer: ', customerId)
    const result = await this.props.createConversationMutation({
      variables: {
        customerId: customerId,
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
  graphql(createCustomerAndFirstConversation, {name: 'createCustomerAndFirstConversationMutation'}),
  graphql(authenticateCustomer, {name: 'authenticateCustomerMutation'}),
)(App)

export default withApollo(appWithMutations)
