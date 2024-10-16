import { React, useState } from 'react';
import './App.css';
import { useCommitText } from './hooks/useCommitText';
import { useHelia } from './hooks/useHelia';

export default function App() {
  const [text, setText] = useState('');
  const { error, starting } = useHelia();
  const {
    cidString,
    commitText,
    fetchCommittedText,
    committedText
  } = useCommitText();

  return (
    <div className="App">
      <div
        id="heliaStatus"
        style={{
          border: `4px solid ${error ? 'red' : starting ? 'yellow' : 'green'}`,
          paddingBttom: '4px'
        }}> Helia status</div>

      <input
        id="textInput"
        value={text}
        onChange={event => setText(event.target.value)}
        type='text' />

      <button
        id="commitTextButton"
        onClick={() => commitText(text)}>Add text to Node</button>

      <div id="cidOutput">textCid: {cidString
        && (<>
          <button id='fetchCommittedTextButton'
            onClick={() => fetchCommittedText()}
          >Fetch committed text</button>
          <div id='committedTextOutput'>Committed Text: {committedText}</div>
        </>)}
      </div>
    </div>);
}