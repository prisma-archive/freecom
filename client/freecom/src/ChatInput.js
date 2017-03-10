import React, { Component} from 'react'
import './ChatInput.css'
import Dropzone from 'react-dropzone'

class ChatInput extends Component {

  state = {
    inputHasFocus: true
  }

  static propTypes = {
    message: React.PropTypes.string.isRequired,
    onTextInput: React.PropTypes.func.isRequired,
    onResetText: React.PropTypes.func.isRequired,
    onSend: React.PropTypes.func.isRequired,
    onDrop: React.PropTypes.func.isRequired,
  }

  render() {
    return (
      <div className={`chat-input flex items-center radius-bottom
            ${this.state.inputHasFocus ? 'chat-input-shadow' : 'light-background'}`}>
        <input
          className={`InputField input ${!this.state.inputHasFocus && 'light-background'}`}
          type='text'
          placeholder='Write a reply ...'
          value={this.props.message}
          autoFocus={true}
          onChange={(e) => this.props.onTextInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.keyCode === 13) { // ENTER
              this.props.onSend()
              this.props.onResetText()
            }
          }}
          onFocus={() => {
            this.setState({inputHasFocus: true})
          }}
          onBlur={() => {
            this.setState({inputHasFocus: false})
          }}
        />
        <Dropzone
          className='input-dropzone'
          onDrop={this.props.onDrop}
          accept='image/*'
          multiple={false}
        >
          <div className='attachment-container h100'>
            <img
              src={require('./assets/attachment.svg')}
              alt=''
              width={26}
              height={26}
              className='opacity-3 pointer'
            />
          </div>
        </Dropzone>
      </div>
    )
  }
}

export default ChatInput
