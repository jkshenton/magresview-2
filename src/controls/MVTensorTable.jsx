import './controls.css';
import './MVTensorTable.css';
import React from 'react';
import copy from 'copy-to-clipboard';
// copy to clipboard icon
import { FaCopy } from 'react-icons/fa';
import MVbutton from './MVButton';
let degreeSymbol = "°";

function TensorTable({ tensor, title }) {
    if (!tensor) {
        return null;
    }

    const copyToClipboard = () => {
        const tensorString = tensor.map(row => row.join(', ')).join('\n');
        copy(tensorString);
    };

    return (
        <div className='mv-euler-tensor-table-block'>
            <h3>{title}</h3>
            <table>
                <tbody>
                    {tensor.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                                {row.map((value, cellIndex) => (
                                    <td key={cellIndex}>{value.toFixed(3)}</td>
                                    ))}
                            </tr>
                    ))}
                </tbody>
            </table>
            <MVbutton onClick={copyToClipboard}><FaCopy />&nbsp;Copy R to clipboard</MVbutton>
        </div>
    );
}


function EigenTable({ evecs, evals, title}) {

    if (!evecs) {
        return null;
    }
    const copyToClipboard = () => {
        const tensorString = evecs.map(row => row.join(', ')).join('\n');
        copy(tensorString);
    };


    // as a list
    return (
        <div className="mv-eigenvectors">
            <h3>{title}</h3>
            {evecs.map((eigenvector, index) => (
            <div key={index} className="mv-eigenvector">
            <p>
                ν<sub>{index + 1}</sub> = (
                    {eigenvector.map((val, i) => 
                        <span key={i} className="mv-fixed-width">
                            {val.toFixed(3)}{i < eigenvector.length - 1 ? ', ' : ''}
                        </span>
                    )}
                ), 
                {evals && evals.length > 0 ? 
                    <>&lambda;<sub>{index + 1}</sub> = <span className="mv-fixed-width">{evals[index].toFixed(3)}</span></>
                    : null
                }
            </p>
            </div>

            ))}
        <MVbutton onClick={copyToClipboard}><FaCopy />&nbsp;Copy PAS to clipboard</MVbutton>
        </div>
      );
}


/**
 * Table of equivalent Euler angles between two tensors
 * There should be 16x3 numbers in the angles array, corresponding to the 16 possible combinations of Euler angles
 * that are all equivalent.
 * labels is an array of strings that will be used in the table header (atom A, atom B)
 */
function AngleTable({angles, description}) {

    if (!Array.isArray(angles)) {
        return null;
    }

    // convert all to degrees
    angles = angles.map(row => row.map(val => val * 180 / Math.PI));


    const copyToClipboard = () => {
        const tensorString = angles.map(row => row.join(', ')).join('\n');
        copy(tensorString);
    }

    return (
        <div className='mv-euler-tensor-table-block'>
            <p>{description}</p>
            <table>
                <thead>
                    <tr>
                        <th>α ({degreeSymbol})</th>
                        <th>β ({degreeSymbol})</th>
                        <th>γ ({degreeSymbol})</th>
                    </tr>
                </thead>
                <tbody>
                    {angles.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {row.map((value, cellIndex) => (
                                <td key={cellIndex}>{value.toFixed(3)}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            <MVbutton onClick={copyToClipboard}><FaCopy />&nbsp;Copy Euler angles to clipboard</MVbutton>
        </div>);
}

// export tensor table and eigen table
export { TensorTable, EigenTable, AngleTable};