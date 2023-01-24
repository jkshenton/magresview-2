/**
 * Listeners for color scales
 */

import _ from 'lodash';
import { getSel, getNMRData } from '../utils';
import { getColorScale } from '../../../utils';

function colorScaleListener(state) {

    let app = state.app_viewer;
    let current_view = state.cscale_view;
    let current_greyed = state.cscale_displ;
    let displayed = app.displayed;

    let next_view = getSel(app);
    let next_greyed = null;

    const cstype = state.cscale_type;
    const cmap = state.cscale_cmap;

    // Restore color to the grayed out atoms
    if (current_greyed) {
        current_greyed.setProperty('color', null);
    }

    if (cstype !== 'none') {

        // Split in prefix and mode
        const [prefix, mode] = cstype.split('_', 2);
        const ref_table = state[prefix + '_references'];

        next_greyed = displayed.xor(next_view);

        const nmrdata = getNMRData(next_view, mode, prefix, ref_table);
        const values = nmrdata[1];

        // if there any any null values, reset colors and throw error
        if (values.indexOf(null) >= 0) {
            if (current_view)
                current_view.setProperty('color', null);
            // reset color scale limits
            state.cscale_lims = [0, 1];
            state.cscale_units = '';
            throw Error('Cannot plot color scale because there are null values. ');
        }

        if (cstype === 'efg_Q') {
            // Special case for EFG Q
            // convert all to absolute values
            values.forEach((v, i) => values[i] = Math.abs(v));
        }


        let minv = _.min(values);
        let maxv = _.max(values);
        let cs = getColorScale(minv, maxv, cmap);
        let colors = values.map((v) => cs.getColor(v).toHexString());

        // store minv and maxv TODO: is this the correct place to do this?
        state.cscale_lims = [minv, maxv];

        // store units
        state.cscale_units = nmrdata[0];

        next_view.setProperty('color', colors);
        next_greyed.setProperty('color', 0x888888);
    }
    else {
        if (current_view)
            current_view.setProperty('color', null);
    }

    return {
        cscale_view: next_view,
        cscale_displ: next_greyed
    };
}

export { colorScaleListener };