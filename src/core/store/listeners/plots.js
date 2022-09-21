import _ from 'lodash';
import { getSel, getNMRData } from '../utils';

function plotsListener(state) {

    const minx = parseFloat(state.plots_min_x);
    const maxx = parseFloat(state.plots_max_x);

    const miny = parseFloat(state.plots_min_y);
    const maxy = parseFloat(state.plots_max_y);

    // Get target atom view
    const app = state.app_viewer;
    const view = getSel(app);
    const ref_table = state.ms_references;
    const use_refs = state.plots_use_refs;
    const nmr_mode = use_refs? 'cs' : 'iso';

    // Is there even anything to plot?
    let noplot = !view;
    noplot = noplot || (isNaN(minx) || isNaN(maxx) || isNaN(miny) || isNaN(maxy));
    noplot = noplot || (state.plots_mode === 'none');

    if (noplot) {
        return {
            plots_data: []
        };
    }

    let xaxis = [];
    let yaxis = [];

    const w = parseFloat(state.plots_peak_width);
    const n = parseInt(state.plots_x_steps);
    const peaks = getNMRData(view, nmr_mode, 'ms', ref_table)[1];         
    const labels = view.atoms.map((a) => a.crystLabel);
    const rangepeaks = peaks.filter((x) => (x+w >= minx && x-w <= maxx));
    // filter labels by peak positions
    const rangelabels = labels.filter((x, i) => (rangepeaks.indexOf(peaks[i]) >= 0));
    // check that rangelabels has the same length as rangepeaks
    if (rangelabels.length !== rangepeaks.length) {
        throw Error('Mismatch between labels and peaks');
    }
    // sort labels and peaks by peak position
    const sorted = _.zip(rangepeaks, rangelabels).sort((a, b) => (a[0] - b[0]));
    const sortedpeaks = sorted.map((x) => x[0]);
    const sortedlabels = sorted.map((x) => x[1]);


    switch(state.plots_mode) {
        case 'bars-1d':

            xaxis = sortedpeaks;
            yaxis = xaxis.map(() => (maxy * 0.75));

            break;
        case 'line-1d':

            function lorentzian(x, x0, w) {
                return 0.5/Math.PI*w/(Math.pow(x-x0, 2)+0.25*w*w);  // Lorentzian peak
            }

            xaxis = _.range(n).map((i) => (minx + (maxx-minx)*i/(n-1)));
            yaxis = xaxis.map((x) => {
                return sortedpeaks.reduce((s, x0) => (s + lorentzian(x, x0, w)), 0);
            });

            break;
        default:
            break;
    }


    // Build x range
    const data = [{
        id: 'Curve',
        data: xaxis.map((x, i) => ({
            x: x,
            y: yaxis[i]
        })),
        // return labels for peaks in the range
        // or empty array if no peaks in range
        peaks: sortedpeaks? sortedpeaks : [],
        labels: sortedlabels? sortedlabels: [],
    }];

    return {
        plots_data: data
    };
}

export { plotsListener };