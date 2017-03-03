import React, { Component} from 'react'
import './ChatInput.css'
import Dropzone from 'react-dropzone'

class ChatInput extends Component {

  render() {
    return (
      <div className='chat-input flex flex-bottom radius-bottom background-white'>
        <input
          className='InputField input'
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
        <Dropzone
          className='Dropzone'
          onDrop={this.props.onDrop}
          accept='image/*'
          multiple={false}
        >
          <img
            src={require('./assets/attachment.svg')}
            alt=""
            width={36}
            height={36}
            className='opaque pointer'
          />
        </Dropzone>
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
