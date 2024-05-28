import './controls.css';
import './MVTensorTable.css';
import React from 'react';
import copy from 'copy-to-clipboard';
// copy to clipboard icon
import { FaCopy } from 'react-icons/fa';
import MVbutton from './MVButton';

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

// export tensor table and eigen table
export { TensorTable, EigenTable };