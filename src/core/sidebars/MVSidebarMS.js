import './MVSidebarMS.css';

import _ from 'lodash';
import React, { useState, useEffect } from 'react';

import MagresViewSidebar from './MagresViewSidebar';
import { useMSInterface } from '../store';
import { chainClasses } from '../../utils';

import MVCheckBox from '../../controls/MVCheckBox';
import MVRange from '../../controls/MVRange';
import MVButton from '../../controls/MVButton';
import MVRadioButton, { MVRadioGroup } from '../../controls/MVRadioButton';
import MVModal from '../../controls/MVModal';
import MVText from '../../controls/MVText';

function MVReferenceTable(props) {

    const msint = props.msInterface;
    const [ refTable, setRefTable ] = useState(msint.referenceTable);

    // We store a copy of the reference list internally; it only gets set on
    // the interface once we click OK. This is to avoid needless expensive 
    // operations when typing text in the fields, especially if the CS labels
    // are on.

    useEffect(() => {
        setRefTable(msint.referenceTable);
    }, [msint]);

    const elements = _.keys(refTable).sort();

    function copyAll(v) {
        setRefTable(_.fromPairs(elements.map((el) => [el, v])));
    }

    return (<MVModal title='References for chemical shifts, by element (ppm)' display={props.display} onClose={props.close} onAccept={() => { msint.updateReferenceTable(refTable); props.close(); }}>
        <div className='mv-msref-table'>
            {elements.map((el) => {
                const ref = refTable[el];

                return (<div className='mv-msref-table-row'>
                            <div className='mv-msref-table-el'>{el}</div>
                            <div className='mv-msref-table-ref'>
                                <MVText value={ref} onChange={(v) => { setRefTable({...refTable, [el]: v}) }} size={5}/>
                            </div>
                            <div className='mv-msref-table-copy'>
                                <MVButton onClick={() => { copyAll(ref); }}>Apply to all</MVButton>
                            </div>
                        </div>);
            })}
        </div>
    </MVModal>);
}


function MVSidebarMS(props) {

    const [ state, setState ] = useState({
        showRefTable: false
    });

    const msint = useMSInterface();

    console.log('[MVSidebarMS rendered]');

    var has_ms = false;
    if (props.show) {
        has_ms = msint.hasData;
    }

    return (<MagresViewSidebar show={props.show} title='Magnetic Shielding'>
        <div className={chainClasses('mv-sidebar-block', has_ms? '' : 'hidden')}>
             <MVCheckBox onCheck={(v) => { msint.hasEllipsoids = v; }} checked={msint.hasEllipsoids}>Ellipsoids</MVCheckBox>
             <MVRange min={0.01} max={0.5} step={0.005} value={msint.ellipsoidScale}
                      onChange={(s) => { msint.ellipsoidScale = s; }} disabled={!msint.hasEllipsoids} noState>Ellipsoid scale</MVRange>
             <MVButton onClick={() => { msint.ellipsoidScale = 0; }} disabled={!msint.hasEllipsoids}>Set auto scale</MVButton>
             <MVRadioGroup label='Show labels' onSelect={(v) => { msint.labelsMode = v; }} selected={msint.labelsMode} name='ms_label_radio'>
                <MVRadioButton value='none'>None</MVRadioButton>
                <MVRadioButton value='iso'>Isotropy (ppm)</MVRadioButton>
                <MVRadioButton value='cs'>Chemical Shifts (ppm, uses references)</MVRadioButton>
                <MVRadioButton value='aniso'>Anisotropy (ppm)</MVRadioButton>
                <MVRadioButton value='asymm'>Asymmetry</MVRadioButton>
             </MVRadioGroup>
             <MVRadioGroup label='Use color scale' onSelect={(v) => { msint.cscaleMode = v; }} selected={msint.cscaleMode} name='ms_cscale_radio'>
                <MVRadioButton value='none'>None</MVRadioButton>
                <MVRadioButton value='iso'>Isotropy (ppm)</MVRadioButton>
                <MVRadioButton value='aniso'>Anisotropy (ppm)</MVRadioButton>
                <MVRadioButton value='asymm'>Asymmetry</MVRadioButton>
             </MVRadioGroup>
             <MVButton onClick={() => { setState({...state, showRefTable: true}) }}>Set References</MVButton>
             <MVReferenceTable display={state.showRefTable} close={() => { setState({...state, showRefTable: false}) }} msInterface={msint}/>
          </div>
         <div className={chainClasses('mv-warning-noms', has_ms? 'hidden': '')}>No MS data found</div>
    </MagresViewSidebar>);
}

export default MVSidebarMS;