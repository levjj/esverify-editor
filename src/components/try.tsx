import React = require('react');
import AceEditor, { Annotation } from 'react-ace';
import 'brace';
import 'brace/mode/javascript';
import 'brace/theme/chrome';
import { Message } from 'esverify';
import { AppState, Action, verify } from '../app';
import ExampleDropDown from './example_dropdown';

export interface Props {
  state: AppState;
  dispatch: (action: Action) => void;
}

function messageType (msg: Message): 'info' | 'warning' | 'error' {
  switch (msg.status) {
    case 'verified': return 'info';
    case 'unverified': return 'warning';
    case 'timeout': return 'warning';
  }
  return 'error';
}

function messageText (msg: Message): string {
  switch (msg.status) {
    case 'verified':
      return `verified: ${msg.description}`;
    case 'unverified':
    case 'unknown':
      return `${msg.status}: ${msg.description}`;
    case 'error':
      return `error: ${msg.type} ${msg.description}`;
    case 'timeout':
      return `timeout: ${msg.description}`;
  }
}

function messageAsAnnotation (msg: Message): Annotation {
  return {
    row: Math.max(0, msg.loc.start.line - 1),
    column: msg.loc.start.column,
    text: messageText(msg),
    type: messageType(msg)
  };
}

export default function component ({ state, dispatch }: Props) {
  return (
    <div className='panel'>
      <div className='panel-header'>
        <div className='panel-title'>
          <span className='h4'>Live Demo and Examples</span>
          <div className='float-right'>
            <ExampleDropDown selected={state.selected} dispatch={dispatch} />
            {' '}
            <button
              className={(state.verificationProcess === 'inprogress' ? 'loading ' : '') + 'btn btn-primary'}
              onClick={() => dispatch(verify(state.sourceCode))}>verify</button>
          </div>
        </div>
      </div>
      <div className='panel-body'>
        <AceEditor
          style={{ width: '100%', height: '65vh' }}
          mode='javascript'
          theme='chrome'
          showPrintMargin={false}
          setOptions={{
            fontFamily: 'Fira Code',
            fontSize: '12pt'
          }}
          annotations={state.messages.map(messageAsAnnotation)}
          onChange={newSource => dispatch({ type: 'CHANGE_SOURCE', newSource })}
          value={state.sourceCode}
        />
      </div>
    </div>
  );
}
