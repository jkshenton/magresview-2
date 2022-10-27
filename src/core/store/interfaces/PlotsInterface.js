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

import { Events } from '../listeners';

import { loadImage } from '../../../utils';
import { makeSelector, DataCheckInterface } from '../utils';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';

const initialPlotsState = {
    plots_mode: 'none',
    plots_use_refs: false,
    plots_q2_shifts: true,
    plots_show_axes: true,
    plots_show_grid: true,
    plots_bkg_img_url: null,
    plots_bkg_img_w: 0,
    plots_bkg_img_h: 0,
    plots_min_x: 0,
    plots_max_x: 100.0,
    plots_min_y: 0,
    plots_max_y: 5.0,
    plots_peak_width: 1.0,
    plots_x_steps: 250,
    plots_data: null,
    plots_show_labels: true,
};

function makePlotAction(data) {
    return {
        type: 'update',
        data: {
            ...data,
            listen_update: [Events.PLOTS_RECALC]
        }
    };
}

class PlotsInterface extends DataCheckInterface {

    get mode() {
        return this.state.plots_mode;
    }

    set mode(v) {
        this.dispatch(makePlotAction({ plots_mode: v }));
    }

    get useQ2Shift() {
        return this.state.plots_q2_shifts;
    }

    set useQ2Shift(v) {
        this.dispatch(makePlotAction({ plots_q2_shifts: v }));
    }

    get useRefTable() {
        return this.state.plots_use_refs;
    }

    set useRefTable(v) {
        this.dispatch(makePlotAction({ 
            plots_use_refs: v,
         }));
    }   

    get showAxes() {
        return this.state.plots_show_axes;
    }

    set showAxes(v) {
        this.dispatch({
            type: 'update',
            data: {
                plots_show_axes: v
            }
        });
    }

    get showGrid() {
        return this.state.plots_show_grid;
    }

    set showGrid(v) {
        this.dispatch({
            type: 'update',
            data: {
                plots_show_grid: v
            }
        });
    }

    get showLabels() {
        return this.state.plots_show_labels;
    }

    set showLabels(v) {
        this.dispatch({
            type: 'update',
            data: {
                plots_show_labels: v
            }
        });
    }
    
    get peakW() {
        return this.state.plots_peak_width;
    }

    set peakW(v) {
        this.dispatch(makePlotAction({ plots_peak_width: v }));
    }

    get rangeX() {
        return [this.state.plots_min_x, this.state.plots_max_x];
    }

    get floatRangeX() {
        let xmin = parseFloat(this.state.plots_min_x);
        let xmax = parseFloat(this.state.plots_max_x);

        xmin = isNaN(xmin)? 0.0 : xmin;
        xmax = isNaN(xmax)? xmin+100.0 : xmax;

        return [xmin, xmax];
    }

    get rangeY() {
        return [this.state.plots_min_y, this.state.plots_max_y];        
    }

    get floatRangeY() {
        let ymin = parseFloat(this.state.plots_min_y);
        let ymax = parseFloat(this.state.plots_max_y);

        ymin = isNaN(ymin)? 0.0 : ymin;
        ymax = isNaN(ymax)? ymin+100.0 : ymax;

        return [ymin, ymax];
    }

    get xSteps() {
        return this.state.plots_x_steps;
    }

    set xSteps(v) {
        this.dispatch(makePlotAction({ plots_x_steps: v }));
    }

    setRange(vmin=null, vmax=null, axis='x') {

        if ('xy'.indexOf(axis) < 0) {
            // Invalid axis
            return;
        }

        vmin = (vmin === null? this.state['plots_min_' + axis] : vmin);
        vmax = (vmax === null? this.state['plots_max_' + axis] : vmax);

        this.dispatch({
            type: 'update',
            data: {
                ['plots_min_' + axis]: vmin,
                ['plots_max_' + axis]: vmax,
                listen_update: [Events.PLOTS_RECALC]
            }
        });
    }

    get data() {
        return this.state.plots_data;
    }

    // download existing svg
    // TODO: there must be a way of selecting from the react component instead of 
    // using the DOM directly
    downloadSVG() {
        let node = "#root > div > div > div.mv-control.mv-modal.mv-modal-draggable.mv-modal-resizable > div.mv-modal-content > div > div > svg";
        let svg = document.querySelector(node);
        let svgData = new XMLSerializer().serializeToString(svg);
        let svgBlob = new Blob([svgData], {type:"image/svg+xml;charset=utf-8"});
        let svgUrl = URL.createObjectURL(svgBlob);
        let downloadLink = document.createElement("a");
        downloadLink.href = svgUrl;
        downloadLink.download = "plot.svg";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }
    // download data
    downloadData() {
        let data = this.data[0].data;
        let csvContent = "data:text/csv;charset=utf-8,";
        // x header depends on if use_refs is true
        let xlabel = this.useRefTable? "Chemical shift /ppm" : "Shielding /ppm";
        let factor = this.useRefTable? -1 : 1;
        csvContent += xlabel + ", Intensity \n";
        data.forEach(function(r) {
            let row = factor*r.x + ", " + r.y + "\n";
            csvContent += row;
        });
        let encodedUri = encodeURI(csvContent);
        let link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "magresview_plot_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }


    get bkgImage() {
        if (this.state.plots_bkg_img_url) {
            return {
                url: this.state.plots_bkg_img_url,
                width: this.state.plots_bkg_img_w,
                height: this.state.plots_bkg_img_h
            };
        }

        return null;
    }

    loadBkgImage(files) {
        const dispatch = this._dispatcher;
        loadImage(files[0]).then((img) => {
            dispatch({
                type: 'update',
                data: {
                    plots_bkg_img_url: img.src,
                    plots_bkg_img_w: img.naturalWidth,
                    plots_bkg_img_h: img.naturalHeight
                }
            });
        });
    }

    clearBkgImage() {
        this.dispatch({
            type: 'update',
            data: {
                plots_bkg_img_url: null,
                plots_bkg_img_w: 0,
                plots_bkg_img_h: 0
            }
        });
    }

}

// Hook for interface
function usePlotsInterface() {
    let state = useSelector(makeSelector('plots', ['app_viewer']), shallowEqual);
    let dispatcher = useDispatch();

    let intf = new PlotsInterface(state, dispatcher);

    return intf;
}


export default usePlotsInterface;
export { initialPlotsState };
