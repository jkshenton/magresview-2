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

import './MagresViewScreenshot.css';

import { FaCamera } from 'react-icons/fa';
import useAppInterface from './store/interfaces/AppInterface';
import { saveImage } from '../utils';


function MagresViewScreenshot(props) {

    const appint = useAppInterface();
    let scale_pixels = props.scale_pixels || 2;
    let transparent = props.transparent || true;
    function takeScreenshot() {
        let data = appint.viewer.getScreenshotData(transparent, scale_pixels);
        // // Display the screenshot data in the browser - useful for debugging
        // const img = new Image();
        // img.src = data;
        // document.body.appendChild(img);
        saveImage(data, 'MagresViewScreenshot.png');
    }

    return (<div className='mv-sshot' onClick={takeScreenshot}>
        <FaCamera />
        <div className='mv-sshot-text'>
            Take a screenshot
        </div>
    </div>);
}

export default MagresViewScreenshot;