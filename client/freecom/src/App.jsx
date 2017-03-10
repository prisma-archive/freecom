import React, { Component } from 'react'
import cx from 'classnames'
import './App.css'
import Chat from './Chat'
import ChatHeader from './ChatHeader'
import ConversationsList from './ConversationsList'
import ConversationsListHeader from './ConversationsListHeader'
import { graphql, compose, withApollo } from 'react-apollo'
import gql from 'graphql-tag'
import generateStupidName from 'sillyname'
import { timeDifference } from './utils'

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
  mutation createConversation($customerId: ID!, $slackChannelName: String!) {
    createConversation(customerId: $customerId, slackChannelName: $slackChannelName) {
      id
      updatedAt
      slackChannelName
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

const INITIAL_SECONDS_UNTIL_RERENDER = 4

class App extends Component {

  _timer = null

  state = {
    isOpen: true,
    selectedConversationId: null,
    conversations: [],
    displayState: 'CONVERSATIONS', // 'CONVERSATIONS' or 'CHAT'
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
    }
    else {
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
    const customerExists = Boolean(customerId)
    const conversationExists = Boolean(this.state.selectedConversationId)
    const panelStyles = cx('panel drop-shadow radius overflow-hidden', {
      'hide': !this.state.isOpen,
      'fadeInUp':this.state.isOpen,
    })
    const buttonStyles = cx('button drop-shadow-hover pointer flex-center flex', {
      'drop-shadow-hover-active': this.state.isOpen
    })

    return (
      <div className='App'>
        {
          <div>
            <div className='container'>
              <div className={panelStyles}>

                {!conversationExists ?
                Boolean(this.state.conversations) &&
                this._conversationsList()
                :
                customerExists &&
                this._chat(customerId)}

              </div>
              <div
                style={{backgroundColor: global['Freecom'].mainColor}}
                className={buttonStyles}
                onClick={() => this._togglePanel()}
              >
                <i className='material-icons'>{this.state.isOpen ? 'close' : 'chat_bubble'}</i>
              </div>
            </div>
          </div>
        }
      </div>
    )
  }

  _conversationsList = () => {
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

  _chat = (customerId) => {
    const selectedConversation = this.state.conversations.find(conversation => {
      return conversation.id === this.state.selectedConversationId
    })

    const agent = selectedConversation.agent
    const chatPartnerName = agent ?
      selectedConversation.agent.slackUserName : global['Freecom'].companyName
    const profileImageUrl = agent && agent.imageUrl ? agent.imageUrl : global['Freecom'].companyLogoURL

    const now = new Date().getTime()
    const updated = new Date(selectedConversation.updatedAt).getTime()
    const created = timeDifference(now, updated)

    console.log('App - render chat with agent: ', selectedConversation.agent)

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
      query: gql`
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
      `,
    }).subscribe({
      next: this._handleNewMessage,
      error(error) {
        console.error('App - Subscription callback with error: ', error)
        console.debug('App - Subscribe again')
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
    this.setState(
      {
        secondsUntilRerender: INITIAL_SECONDS_UNTIL_RERENDER,
        conversations: newConversations
      },
      () => this._rerender()
    )

    this._updateLastMessageInConversation(data.Message.node.conversation.id, data.Message.node)
  }

  _setupNewCustomer = async () => {
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

  _loadConversations = async (customerId) => {
    const findConversationsResult = await this.props.client.query({
      query: findConversations,
      variables: {
        customerId
      }
    })

    const sortedConversations = findConversationsResult.data.allConversations.slice()
    sortedConversations.sort((conversation1, conversation2) => {
      const lastMessage1 = conversation1.messages[0]
      const lastMessage2 = conversation2.messages[0]

      if (!lastMessage1 || !lastMessage2) {
        return 0
      }

      const date1 = new Date(lastMessage1.createdAt).getTime()
      const date2 = new Date(lastMessage2.createdAt).getTime()
      if (date1 > date2) {
        return -1
      }
      if (date1 < date2) {
        return 1
      }
      return 0
    })

    this.setState({conversations: sortedConversations})
  }

  _updateLastMessageInConversation = (conversationId, newLastMessage) => {
    const newConversations = this.state.conversations.slice()
    const indexOfConversationToUpdate = newConversations.findIndex(conversation => {
      return conversation.id === conversationId
    })
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

  _togglePanel = () => this.setState({isOpen: !this.state.isOpen})

  _initiateNewConversation = () => {

    const customerId = localStorage.getItem(FREECOM_CUSTOMER_ID_KEY)
    const username = localStorage.getItem(FREECOM_CUSTOMER_NAME_KEY)

    const emptyConversation = this.state.conversations.find(conversation => {
      return conversation.messages.length === 0
    })

    if (Boolean(emptyConversation)) {
      this.setState({selectedConversationId: emptyConversation.id})
    }
    else {
      this._createNewConversation(customerId, username)
    }
  }

  _createNewConversation = async (customerId, username) => {

    // find channel with greatest position appended as suffix
    const channelPositions = this.state.conversations.map(conversation => {
      const slackChannelNameComponents = conversation.slackChannelName.split('-')
      return slackChannelNameComponents[slackChannelNameComponents.length-1]
    })

    let newChannelPosition = 1
    if (channelPositions.length > 0) {
      const maxPosition = Math.max.apply(null, channelPositions)
      newChannelPosition = maxPosition + 1
    }
    const newChannelName = (username + '-' + newChannelPosition).toLowerCase()

    // create new conversation for the customer
    console.debug('Create conversation for existing customer: ', customerId, newChannelName)
    const result = await this.props.createConversationMutation({
      variables: {
        customerId: customerId,
        slackChannelName: newChannelName
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

  _generateShortStupidName = () => {
    const maxLength = 17
    const username = generateStupidName()
    if (username.length > maxLength) {
      return this._generateShortStupidName()
    }
    const usernameWithoutSpace = username.replace(' ', '-')
    return usernameWithoutSpace
  }

  _rerender = () => {
    this.setState(
      { secondsUntilRerender: this.state.secondsUntilRerender * 2 },
      () => {
        this._timer = setTimeout(this._rerender, this.state.secondsUntilRerender * 1000)
        this.forceUpdate()
      }
    )
  }
}

const appWithMutations = compose(
  graphql(createConversation, {name : 'createConversationMutation'}),
  graphql(createCustomer, {name: 'createCustomerMutation'}),
  graphql(createCustomerAndConversation, {name: 'createCustomerAndConversationMutation'})
)(App)

export default withApollo(appWithMutations)
