import React = require('react');
import { AppState, Action, verify, verificationInProgress, availableVerificationConditions,
         InteractiveVC, currentVC, currentIVC} from '../app';
import ExampleDropDown from './example_dropdown';
import VCPanel from './vc_panel';
import Editor from './editor';
import { Message, formatMessage, SourceLocation } from 'esverify';
import { Annotation } from 'react-ace';
import SplitPane from 'react-split-pane';

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

function messageAsAnnotation (msg: Message): Annotation {
  return {
    row: Math.max(0, msg.loc.start.line - 1),
    column: msg.loc.start.column,
    // @ts-ignore use 'html' annotation instead of 'text'
    html: formatMessage(msg, false),
    type: messageType(msg)
  };
}

function vcAsAnnotation (vc: InteractiveVC): Annotation {
  const res = vc.vc.getResult();
  if (res === null) {
    return {
      row: Math.max(0, vc.vc.getLocation().start.line - 1),
      column: vc.vc.getLocation().start.column,
      // @ts-ignore use 'html' annotation instead of 'text'
      html: '<b>loading...</b>',
      type: 'warning'
    };
  } else {
    return messageAsAnnotation(res);
  }
}

export default function component ({ state, dispatch }: Props) {
  const annotations: Array<Annotation> = state.message !== undefined
    ? [messageAsAnnotation(state.message)]
    : state.vcs.map(vcAsAnnotation);
  const vc = currentVC(state);
  const sourceAnnotations: Array<[SourceLocation, Array<any>, any]> =
    state.showSourceAnnotations && vc !== undefined && vc.hasModel() ? vc.getAnnotations() : [];
  const ivc = currentIVC(state);
  const availableVCs = availableVerificationConditions(state);
  const pc = vc !== undefined && ivc !== undefined && vc.hasModel() && ivc.selectedFrame !== undefined
    ? vc.callstack()[ivc.selectedFrame][1] : undefined;
  return (
    <SplitPane split='vertical' defaultSize='66%' className='container grid-xl' style={{ height: '90vh' }}>
      <div>
        <div className='p-2'>
          <div className='float-right'>
            <ExampleDropDown selected={state.selected} dispatch={dispatch} />
            {' '}
            <button
              className={(verificationInProgress(state) ? 'loading ' : '') + 'btn btn-primary'}
              onClick={() => dispatch(verify(state.sourceCode))}>Verify</button>
          </div>
          <h4 className='my-2'>Interactive Verification Environment</h4>
        </div>
        <Editor
          annotations={annotations}
          selectedVC={ivc === undefined ? undefined : ivc.vc.getLocation()}
          pc={pc}
          sourceAnnotations={sourceAnnotations}
          sourceCode={state.sourceCode}
          dispatch={dispatch} />
        <div className='form-group float-right'>
          <label className='form-switch'>
            <input type='checkbox'
                   checked={state.showSourceAnnotations}
                   onChange={evt => dispatch({ type: 'SET_SOURCE_ANNOTATIONS', enabled: evt.target.checked }) } />
            <i className='form-icon'></i> Show Counter Example Annotations
          </label>
        </div>
      </div>
      {state.selectedLine === undefined ? <div /> :
        <div className='panel vc-panel'>
          <div className='panel-header'>
            <div className='panel-title'>
              <div className='dropdown dropdown-right'>
                {availableVCs.length > 1 ? (
                  <button className='btn dropdown-toggle float-right' tabIndex={0}>
                     ▼
                  </button>
                ) : ''}
                {availableVCs.length > 1 ? (
                  <ul className='menu'>
                    {availableVCs.map((vc, idx) => {
                      return (
                        <li className='menu-item' key={idx}>
                          <a
                            className={vc === ivc ? 'active' : ''}
                            href='#'
                            onClick={e => { e.preventDefault(); dispatch({ type: 'SELECT_VC', selected: vc.vc }); }}>
                            {vc.vc.getDescription()}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                ) : ''}
                {ivc === undefined
                  ? 'Select a Verification Condition ▼'
                  : <h6>{ivc.vc.getDescription()}</h6>}
              </div>
            </div>
          </div>
          {ivc === undefined ? '' :
            <VCPanel verificationCondition={ivc} dispatch={dispatch} />
          }
        </div>
      }
    </SplitPane>
  );
}
