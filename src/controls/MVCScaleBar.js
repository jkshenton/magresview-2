import './MVCScaleBar.css';
import React from 'react';
import ColorScale from 'color-scales';
import colormap from 'colormap';


function get_colorbar(min, max, units, hidden=false) {
    if (hidden) {
        return null;
    }

    console.log(units);

    // must be odd to display correctly
    const ncolors = 11;
    let color_spec = colormap({
        colormap: 'portland',
        nshades: ncolors,
        format: 'hex',
        alpha: 1
    });
    let cscale = new ColorScale(0, 1, color_spec, 1.0);
    // make table with one row and nshades columns and color the cells
    let cells = [];
    let ticks = [];
    let cell_values = [];
    // values is a range from 0 to 1 with nshades elements
    let values = Array.from(Array(ncolors).keys()).map(x => x/ncolors);
    let colors = values.map((v) => cscale.getColor(v).toHexString());
    for (let i = 0; i < colors.length; i++) {
        const key_stub = i.toString();
        cells.push(<td className='mv-cscale-bar' style={{backgroundColor: colors[i]}} key={'c'+i} ></td>);
        // only show ticks for the first, middle and last color
        if (i === 0 || i === ((colors.length-1)/2) || i === colors.length-1) {
            ticks.push(<td className='mv-cscale-tick' key={'t'+key_stub}>|</td>);
        } else {
            ticks.push(<td className='mv-cscale-tick' key={'t'+key_stub}></td>);
        }
        cell_values.push(<td key={'l'+key_stub}></td>);
    }

    // round and display the min, middle and max values
    //  TODO this could all be tidied up! 
    cell_values[0] = <td key={'l0'}>{min.toFixed(2)}</td>;
    cell_values[((cell_values.length-1)/2)] = <td key={'l'+(((cell_values.length-1)/2)).toString()}>{((min+max)/2).toFixed(2)}</td>;
    // add units to final cell
    cell_values[cell_values.length-1] = <td key={'l' + (cell_values.length-1).toString()}>{max.toFixed(2) + ' ' + units}</td>;

    return (
            <table className='mv-cscale-table'>
                <tbody>
                <tr>
                    {cells}
                </tr>
                <tr>
                    {ticks}
                </tr>
                <tr>
                    {cell_values}
                </tr>
                </tbody>
            </table>

    );
}



function MVCScaleBar(props) {

    return (
    <div className='mv-cscalebar'>
            {get_colorbar(props.lims[0], props.lims[1], props.units, props.hidden)}
    </div>);

}

export default MVCScaleBar;