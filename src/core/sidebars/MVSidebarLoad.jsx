import MagresViewSidebar from './MagresViewSidebar';

import { AiFillEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { IoMdRefresh } from 'react-icons/io';
import { MdDeleteForever } from 'react-icons/md';

import MVFile from '../../controls/MVFile';
import MVBox from '../../controls/MVBox';
import MVCheckBox from '../../controls/MVCheckBox';
import MVListSelect, { MVListSelectOption } from '../../controls/MVListSelect';
import MVCustomSelect, { MVCustomSelectOption } from '../../controls/MVCustomSelect';
import MVTooltip from '../../controls/MVTooltip';
import { useAppInterface } from '../store';


import React, { useState } from 'react';
/**
 * MagresView 2.0
 *
 * A web interface to visualize and interact with computed NMR data in the Magres
 * file format.
 *
 * Author: Simone Sturniolo
 *
 * Copyright 2022 Science and Technology Facilities Council
 * This software is distributed under the terms of the MIT License
 * Please refer to the file LICENSE for the text of the license
 * 
 */

import _ from 'lodash';
import { tooltip_molecular_crystal, tooltip_nmr_active, tooltip_vdw_scaling } from './tooltip_messages';
import { exampleFiles } from '../../data/exampleMagres';
import MVRange from '../../controls/MVRange';
import MVButton from '../../controls/MVButton';
// Accepted file formats
const file_formats = ['.cif', '.xyz', '.magres', '.cell'];
const exampleFileNames = Object.keys(exampleFiles);

function MVSidebarLoad(props) {

    const [ state, setState ] = useState({
        load_message: '',
        load_message_status: null,
        list_selected: ''
    });

    const appint = useAppInterface();
    const models = appint.models;

    console.log('[MVSidebarLoad rendered]');

    // Methods
    function loadModel(f) {

        appint.load(f, (success) => {
            // Check success
            let msg = '';
            let err = false;
            _.map(success, (v, n) => {
                if (v !== 0) {
                    msg += 'Error parsing file ' + n + ': ' + v + '\n';
                    err = true;
                }
            });
            if (msg === '') {
                msg = 'All files parsed successfully!'
            }

            setState({
                ...state,
                load_message: msg, 
                load_message_status: err? 'error' : 'success'
            });
        });
    }

    function makeModelOption(m, i) {

        let model_icon;        
        if (m === appint.currentModelName) {
            model_icon = <AiFillEye size={22}/>;
        }
        else {
            model_icon = <AiOutlineEyeInvisible size={22} onClick={() => { appint.display(m); }} />
        }

        return (<MVListSelectOption key={i} value={m} icon={model_icon}>
            {m}
            <IoMdRefresh style={{color: 'var(--dark-color-1)'}} size={22} onClick={() => { appint.reload(m); }}/>
            <MdDeleteForever style={{color: 'var(--err-color-2)'}} size={22} onClick={() => { appint.delete(m); }}/>
        </MVListSelectOption>);
    }

    const loadExampleFile = (selectedExample) => {
        if (selectedExample) {
            const filePath = `/example_magres/${exampleFiles[selectedExample]}`;
            fetch(filePath)
                .then(response => response.text())
                .then(data => {
                    const file = new File([data], exampleFiles[selectedExample], { type: 'text/plain' });
                    loadModel([file]);
                })
                .catch(error => console.error('Error loading file:', error));
        }
    };

    return (<MagresViewSidebar show={props.show} title='Load file'>
        <div className='mv-sidebar-block'>
            <div>Load one of your files</div>
            <MVFile filetypes={file_formats.join(',')} onSelect={loadModel} notext={true} multiple={true}/>
            <span className='sep-1' />
            <div>Or choose from an example file</div>
            <div className='mv-sidebar-row'>
                <MVCustomSelect onSelect={(v) => { appint.exampleSelected = v; }} selected={appint.exampleSelected} name='example_dropdown'>
                    {exampleFileNames.map((n) => {
                        return <MVCustomSelectOption key={n} value={n}>{n}</MVCustomSelectOption>
                    })}
                </MVCustomSelect>
                <MVButton onClick={() => { loadExampleFile(appint.exampleSelected); }} disabled={!appint.exampleSelected}>
                    Load Example
                </MVButton>
            </div>
            <span className='sep-1' />
            <div className='mv-sidebar-block'>
                <div className='mv-sidebar-tooltip-grid'>
                    <div>Display unwrapped molecular units?&nbsp;</div>
                    <MVTooltip tooltipText={tooltip_molecular_crystal} />
                    <MVCustomSelect onSelect={(v) => { appint.loadAsMol = v; }} selected={appint.loadAsMol} name='loadasmol_dropdown'>
                        <MVCustomSelectOption value={null}>Auto</MVCustomSelectOption>
                        <MVCustomSelectOption value={true}>Yes</MVCustomSelectOption>
                        <MVCustomSelectOption value={false}>No</MVCustomSelectOption>
                    </MVCustomSelect>
                </div>
            </div>
            <span className='sep-1' />
            <div className='mv-sidebar-block'>
                <div className='mv-sidebar-tooltip-grid'>
                    <MVCheckBox onCheck={(v) => { appint.useNMRIsotopes = v }} checked={appint.useNMRIsotopes}>Use only NMR active isotopes</MVCheckBox>
                    <MVTooltip tooltipText={tooltip_nmr_active} />
                </div>
                <div className='mv-sidebar-tooltip-grid'>
                    <MVRange min={0.5} max={1.5} step={0.05} value={appint.vdwScaling}
                        onChange={(s) => { appint.vdwScaling = s; }}>
                            vdW scale
                    </MVRange>
                    <MVTooltip tooltipText={tooltip_vdw_scaling} />
                </div>
            </div>
        </div>
        <h4>Files loaded:</h4>
        <MVListSelect selected={state.list_selected} onSelect={(v) => { setState({...state, list_selected: v}); appint.display(v);}}>
            {models.map(makeModelOption)}
        </MVListSelect>
        <span className='sep-1' />
        <MVBox status={state.load_message_status} onClose={() => {setState({...state, load_message_status: ''})}}>
            {state.load_message}
        </MVBox>
    </MagresViewSidebar>);
}

export default MVSidebarLoad;