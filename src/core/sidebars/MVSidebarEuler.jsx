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

import './MVSidebarEuler.css';

import { useRef, useEffect, useState } from 'react';

import MagresViewSidebar from './MagresViewSidebar';
import { useEulerInterface } from '../store';
import { saveContents, copyContents } from '../../utils';

import MVSwitch from '../../controls/MVSwitch';
import MVButton from '../../controls/MVButton';
import MVRadioButton, { MVRadioGroup } from '../../controls/MVRadioButton';
import MVCustomSelect, { MVCustomSelectOption } from '../../controls/MVCustomSelect';
import MVModal from '../../controls/MVModal';
import {EigenTable, TensorTable} from '../../controls/MVTensorTable';
import { FaCopy } from 'react-icons/fa';
import { IoMdSwap } from 'react-icons/io';
import * as mjs from 'mathjs';


/** 
// * Function to get the list of possible tensors for a given atom selection
**/

function MVTensorOptions(props) {
    // Actually unnecessary; we only use it to trigger a re-render
    const [ state, setState ] = useState(1);

    const eulint = useEulerInterface();

    const tensors = eulint.allowedTensorTypes;

    const options = tensors.map((t, i) => {
        return (<MVRadioButton key={i} value={t}> {t.toUpperCase()} </MVRadioButton>);
    });

    
    return (<div>
        <MVRadioGroup label='Atom A tensor' onSelect={(v) => { eulint.tensorA = v; setState(-state); }} selected={eulint.tensorA} name='tensorA_radio'>
            {options}
        </MVRadioGroup>
        <span className='header'>Tensor A ordering:</span>
        <MVCustomSelect zorder={3} selected={eulint.orderA} onSelect={(v) => { eulint.orderA = v; }}>
            <MVCustomSelectOption value='haeberlen'>Haeberlen</MVCustomSelectOption>
            <MVCustomSelectOption value='nqr'>NQR</MVCustomSelectOption>
            <MVCustomSelectOption value='increasing'>Ascending</MVCustomSelectOption>
            <MVCustomSelectOption value='decreasing'>Descending</MVCustomSelectOption>
        </MVCustomSelect>
        <MVRadioGroup label='Atom B tensor' onSelect={(v) => { eulint.tensorB = v; setState(-state); }} selected={eulint.tensorB} name='tensorB_radio'>
            {options}
        </MVRadioGroup>
        <span className='header'>Tensor B ordering:</span>
        <MVCustomSelect zorder={3} selected={eulint.orderB} onSelect={(v) => { eulint.orderB = v; }}>
            <MVCustomSelectOption value='haeberlen'>Haeberlen</MVCustomSelectOption>
            <MVCustomSelectOption value='nqr'>NQR</MVCustomSelectOption>
            <MVCustomSelectOption value='increasing'>Ascending</MVCustomSelectOption>
            <MVCustomSelectOption value='decreasing'>Descending</MVCustomSelectOption>
        </MVCustomSelect>

    </div>);
}


/**
 * Modal to display the two tensors principal axes
 * and the rotation matrix between them.
 * 
**/ 
function MVEulerTensorTableModal(props) {
    const eulint = useEulerInterface();
    // get labels
    const labelA = eulint.atomLabelA;
    const labelB = eulint.atomLabelB;
    // get ordering
    const orderA = eulint.orderA;
    const orderB = eulint.orderB;

    // get tensors
    let tensorA = eulint.tensorAValues;
    let tensorB = eulint.tensorBValues;

    if (tensorA) {
        // set order
        tensorA.convention = orderA;
    }
    if (tensorB) {
        // set order
        tensorB.convention = orderB;
    }


    
    // get eigenvectors if tensorA and tensorB are not null
    // Note that sorted_eigenvectors() returns a 3x3 matrix in which the columns are the eigenvectors
    // so we need to transpose it to get the rows
    const evecsA = tensorA? mjs.transpose(tensorA.eigenvectors) : null;
    const evecsB = tensorB? mjs.transpose(tensorB.eigenvectors) : null;

    const evalsA = tensorA? tensorA.eigenvalues : null;
    const evalsB = tensorB? tensorB.eigenvalues : null;

    let R = null;
    if (tensorA && tensorB) {
        R = tensorA.rotationTo(tensorB);
        console.log(R);
    }


    // todo implement get rotation matrix

    let titleA = `A: ${labelA} - ${eulint.tensorA.toUpperCase()} (${orderA} order)`;
    let titleB = `B: ${labelB} - ${eulint.tensorB.toUpperCase()} (${orderB} order)`;

    return (
        <MVModal title='Principal axis systems' display={props.display} hasOverlay={false}
                 onClose={props.close} draggable={true} noFooter={true} resizable={true}>
                <EigenTable evecs={evecsA} title={titleA} evals={evalsA}/>
                <EigenTable evecs={evecsB} title={titleB} evals={evalsB}/>
                <TensorTable tensor={R} title='Rotation matrix A->B'/>
        </MVModal>
    );
}


function MVSidebarEuler(props) {

    const eulint = useEulerInterface();

    console.log('[MVSidebarEuler rendered]');

    const intRef = useRef();
    intRef.current = eulint;

    useEffect(() => {
        let eulint = intRef.current;

        // Only keep events bound when this sidebar is visible!
        if (props.show) {
            eulint.bind();
        }
        else {
            eulint.unbind();
        }

    }, [props.show]);


    // Round values
    let a = eulint.alpha;
    let b = eulint.beta;
    let c = eulint.gamma;

    if (a !== 'N/A') {
        // It's a number
        a = a.toFixed(2);
        b = b.toFixed(2);
        c = c.toFixed(2);
    }

    const hasSel = (eulint.atomA && eulint.atomB);
    const hasEither = (eulint.atomA || eulint.atomB);

    return (<MagresViewSidebar show={props.show} title='Euler angles'>
        <p>
            Left and right click on atoms to pick a pair of atoms, A and B respectively (which can be the same). Select the pair
            of tensors of interest and the eigenvalue ordering convention to be used.
        </p>
        <div className='mv-sidebar-block'>
            <MVTensorOptions />
        </div>

        {/* button to swap A and B */}
        {/* TODO: this doesn't work correctly for dipolarAB */}
        <div className='mv-sidebar-block'>
            <MVButton onClick={() => { eulint.swapAtoms() }}>
                A <IoMdSwap />  B
            </MVButton>            
        </div>


        
        <div className='mv-sidebar-block'>
            <h3>Convention</h3>
            <MVCustomSelect zorder={3} selected={eulint.convention} onSelect={(v) => { eulint.convention = v; }}>
                <MVCustomSelectOption value='zyz'>ZYZ</MVCustomSelectOption>
                <MVCustomSelectOption value='zxz'>ZXZ</MVCustomSelectOption>
            </MVCustomSelect>
        </div>
        <div className='mv-sidebar-block'>
            <MVButton onClick={() => { eulint.cycleEquivalentAngleConfig(); }}>
                Next equivalent angle set
            </MVButton>
            Current set: [{eulint.equivalentAngleConfig[0]}, {eulint.equivalentAngleConfig[1]}]
        </div>
        <div className='mv-sidebar-block'>
            <h3>Relative Euler Angles</h3>
            <table className='mv-eul-results'>
                <thead>
                    <tr>
                        <td>Alpha</td>
                        <td>Beta</td>
                        <td>Gamma</td>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{a}&deg;</td>
                        <td>{b}&deg;</td>
                        <td>{c}&deg;</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <span className='sep-1' />
        <div className='mv-sidebar-block'>
            <MVButton onClick={() => { copyContents(eulint.txtReport()); }} disabled={!hasSel}><FaCopy />&nbsp;Copy to clipboard</MVButton>            
        </div>
        {/* show modal? */}
        <div className='mv-sidebar-block'>
            <MVButton onClick={() => { eulint.showTable = true; }} disabled={!hasEither}>Show principal axis systems</MVButton>
            <MVEulerTensorTableModal display={eulint.showTable} close={() => { eulint.showTable = false; }} />
        </div>
        <div className='mv-sidebar-block'>
            <MVButton onClick={() => { saveContents('data:,' + eulint.txtSelfAngleTable(), 'eulerTable.txt'); }}  disabled={!(eulint.hasMSData && eulint.hasEFGData)}>
                Download table of MS-to-EFG angles
            </MVButton>            
        </div>

    </MagresViewSidebar>);
}

export default MVSidebarEuler;