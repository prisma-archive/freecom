import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import './index.css'
import ApolloClient, { createNetworkInterface } from 'apollo-client'
import { ApolloProvider } from 'react-apollo'
import {SubscriptionClient, addGraphQLSubscriptions} from 'subscriptions-transport-ws'


// Create WebSocket client
const wsClient = new SubscriptionClient(`wss://subscriptions.graph.cool/cizf8g3fr1sp90139ikdjayb7`, {
  reconnect: true,
  connectionParams: {
    // Pass any arguments you want for initialization
  }
})

const networkInterface = createNetworkInterface({ uri: 'https://api.graph.cool/simple/v1/cizf8g3fr1sp90139ikdjayb7' })

// Extend the network interface with the WebSocket
const networkInterfaceWithSubscriptions = addGraphQLSubscriptions(
  networkInterface,
  wsClient
)

const client = new ApolloClient({
  networkInterface: networkInterfaceWithSubscriptions,
})


ReactDOM.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
  ,
  document.getElementById('root')
)
