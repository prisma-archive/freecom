import React, { Component} from 'react'
import './ChatInput.css'

class ChatInput extends Component {

  render() {
    return (
      <div className='ChatInput'>
        <input
          className='InputField'
          type='text'
          value={this.props.message}
          autoFocus={true}
          onChange={(e) => this.props.onTextInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.keyCode === 13) { // ENTER
              this.props.onSend()
              this.props.onResetText()
            }
          }}
        />
        {/*<div*/}
          {/*onClick={() => this.props.onSend()}*/}
        {/*>*/}
          {/*Send*/}
        {/*</div>*/}
      </div>
    )
  }
}

export default ChatInput

ChatInput.propTypes = {
  message: React.PropTypes.string.isRequired,
  onTextInput: React.PropTypes.func.isRequired,
  onResetText: React.PropTypes.func.isRequired,
  onSend: React.PropTypes.func.isRequired,
}
