import * as React from 'react';
import { Message, formatMessage, SourceLocation } from 'esverify';
import { Annotation } from 'react-ace';
import SplitPane from 'react-split-pane';
import { AppState, Action, verify, verificationInProgress, availableVerificationConditions,
         InteractiveVC, currentVC, currentIVC, runCode } from '../app';
import ExampleDropDown from './example_dropdown';
import VCPanel from './vc_panel';
import Editor from './editor';

export interface Props {
  state: AppState;
  enableTitle: boolean;
  enableExampleSelect: boolean;
  enableVerification: boolean;
  enableSourceAnnotations: boolean;
  enableVCPanel: boolean;
  enableDebugger: boolean;
  enableRunning: boolean;
  large: boolean;
  height: number | undefined;
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

export default function IDVE ({ enableExampleSelect, enableVerification, enableSourceAnnotations, enableVCPanel,
                                enableDebugger, enableRunning, enableTitle, height, large, state, dispatch }: Props) {
  const annotations: Array<Annotation> = state.message !== undefined
    ? [messageAsAnnotation(state.message)]
    : state.vcs.map(vcAsAnnotation);
  const vc = currentVC(state);
  const sourceAnnotations: Array<[SourceLocation, Array<any>, any]> =
    enableSourceAnnotations && state.showSourceAnnotations && vc !== undefined && vc.hasModel()
    ? vc.getAnnotations()
    : [];
  const ivc = currentIVC(state);
  const availableVCs = availableVerificationConditions(state);
  const pc = enableDebugger && vc !== undefined && ivc !== undefined && vc.hasModel() && ivc.selectedFrame !== undefined
    ? vc.callstack()[ivc.selectedFrame][1]
    : undefined;
  return (
    <SplitPane split='vertical'
               defaultSize={enableVCPanel ? (enableTitle ? '60%' : '50%') : '100%'}
               style={{ height: height === undefined ? '80vh' : (height + 4) + 'rem' }}
               className={large ? 'container grid-xl' : 'container grid-lg'}>
      <div>
        <div className='p-2'>
          <div className='float-right'>
            { enableExampleSelect
              ? <ExampleDropDown selected={state.selected} dispatch={dispatch} />
              : ''
            }
            {' '}
            { state.runMessage !== undefined
              ? <span className={'label ' +
                                (state.runMessage === 'code ran successfully' ? 'label-success' : 'label-error')}>
                                {state.runMessage}
                </span>
              : ''}
            {' '}
            { enableRunning ?
              <button
                className={(state.running ? 'loading ' : '') + 'btn btn-primary'}
                onClick={() => dispatch(runCode())}>run</button> : ''}
            {' '}
            { enableVerification ?
              <button
                className={(verificationInProgress(state) ? 'loading ' : '') + 'btn btn-primary'}
                onClick={() => dispatch(verify(state.sourceCode))}>verify</button> : ''}
          </div>
          { enableTitle
            ? <h4 className='my-2'>IDVE: Interactive Development and Verification Environment</h4>
            : ''}
        </div>
        <Editor
          annotations={annotations}
          selectedVC={enableVCPanel && ivc !== undefined ? ivc.vc.getLocation() : undefined}
          pc={pc}
          sourceAnnotations={sourceAnnotations}
          sourceCode={state.sourceCode}
          height={height}
          dispatch={dispatch} />
        { enableSourceAnnotations ?
          <div className='form-group float-right'>
            <label className='form-switch'>
              <input type='checkbox'
                    checked={state.showSourceAnnotations}
                    onChange={evt => dispatch({ type: 'SET_SOURCE_ANNOTATIONS', enabled: evt.target.checked }) } />
              <i className='form-icon'></i> Show Counter Example Popups
            </label>
          </div> : ''}
      </div>
      {!enableVCPanel || state.selectedLine === undefined || availableVCs.length < 1 ? <div /> :
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
            <VCPanel verificationCondition={ivc} enableDebugger={enableDebugger} dispatch={dispatch} />
          }
        </div>
      }
    </SplitPane>
  );
}
