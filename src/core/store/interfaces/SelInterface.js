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

import { makeSelector, BaseInterface } from '../utils';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';

import CrystVis from '@ccp-nc/crystvis-js';

const LC = CrystVis.LEFT_CLICK;
const SLC = CrystVis.LEFT_CLICK + CrystVis.SHIFT_BUTTON;
const CLC = CrystVis.LEFT_CLICK + CrystVis.CTRL_BUTTON;

const initialSelState = {
    sel_selected_view: null,
    sel_displayed_view: null,
    sel_ghosts_requests: {},
    sel_on: false,
    sel_mode: 'atom',
    sel_sphere_r: 2.0,
    sel_bond_n: 1,
    sel_hlight: true,
    sel_sites_view: null,
    sel_sites_labels_type: 'none',
    sel_show_cell: true
};

class SelInterface extends BaseInterface {

    get app() {
        return this.state.app_viewer;
    }

    get selected() {
        return this.state.sel_selected_view;
    }

    set selected(v) {
        if (!v) {
            let model = this.state.app_viewer.model;
            if (model) {
                v = model.view([]);
            }
        }

        this.dispatch({
            type: 'update', 
            data: {
                sel_selected_view: v,
                listen_update: [Events.VIEWS]
            }
        });
    }

    get displayed() {
        return this.state.sel_displayed_view || this.state.app_default_displayed;
    }

    set displayed(v) {
        if (!v) {
            v = this.state.app_default_displayed;
            if (!v) {
                // Then there's just no model at all
                return;
            }
        }
        this.dispatch({
            type: 'update',
            data: {
                sel_displayed_view: v,
                listen_update: [Events.VIEWS]
            }
        });
    }

    get defaultDisplayed() {
        return this.state.app_default_displayed;
    }

    get highlightSelected() {
        return this.state.sel_hlight;
    }

    set highlightSelected(v) {
        let app = this.state.app_viewer;

        if (!app)
            return;

        app.highlightSelected = v;
        this.dispatch({
            type: 'set',
            key: 'sel_hlight',
            value: v
        });
    }

    // labels
    get labelMode() {
        return this.state.sel_sites_labels_type;
    }

    set labelMode(v) {
        this.dispatch({
            type: 'update',
            data: {sel_sites_labels_type: v, listen_update: [Events.SEL_LABELS]}
        });
    }

    get showCell() {
        return this.state.sel_show_cell;
    }

    set showCell(v) {
        this.dispatch({
            type: 'update',
            data: {
                sel_show_cell: v,
                listen_update: [Events.CELL]
            }
        });
    }

    get selectionOn() {
        return this.state.sel_on;
    }

    set selectionOn(v) {
        this.setSelection(this.selectionMode, {on: v});
    }

    get selectionMode() {
        return this.state.sel_mode;
    }

    set selectionMode(v) {
        this.setSelection(v);
    }

    get selectionSphereR() {
        return this.state.sel_sphere_r;
    }

    set selectionSphereR(v) {
        this.setSelection(this.selectionMode, {r: v});
    }

    get selectionBondN() {
        return this.state.sel_bond_n;
    }

    set selectionBondN(v) {
        this.setSelection(this.selectionMode, {n: v});
    }

    get isotopeChoices() {
        // Find which isotopes are available for the currently selected atoms
        let sel = this.selected;
        if (sel === null) {
            return null;
        }

        let elements = sel.map((a, i) => a.element);
        // Are they all the same?
        let el = elements[0];
        if (!elements.reduce((s, x) => (s && x === el), true)) {
            return null;
        }

        // Get the isotope information
        let eData = sel.atoms[0].elementData;

        let iKeys = Object.keys(eData.isotopes).sort();
        let iData = iKeys.map((A, i) => {
            let iso = eData.isotopes[A];
            return {
                A: A,
                is_nmr_active: iso.spin !== 0,
                is_Q_active: iso.Q !== 0,
                is_max_nmr: A === eData.maxiso_NMR,
                is_max_Q: A === eData.maxiso_Q,
                abundance: iso.abundance
            };
        });

        return iData;
    }

    setIsotope(A) {
        let sel = this.selected;
        if (sel === null) {
            return null;
        }

        sel.setProperty('isotope', A);

        // Must update everything that depends on isotope properties
        this.dispatch({
            type: 'update',
            data: {
                listen_update: [Events.EFG_LABELS, Events.CSCALE, 
                                Events.DIP_RENDER, Events.JC_RENDER,
                                Events.SEL_LABELS]
            }
        });
    }

    setSelection(mode, options={}) {
        // Set the selection for a certain mode and options

        let app = this.state.app_viewer;
        if (!app) 
            return;

        let default_options = {
            r: this.selectionSphereR,
            n: this.selectionBondN,
            on: this.selectionOn
        };

        options = {
            ...default_options,
            ...options
        };

        // Selector functions
        let selFunc = null;

        const dd = this.state.app_default_displayed;
        const dd_indices = dd? this.state.app_default_displayed._indices : null;

        if (options.on) {
            switch(mode) {
                case 'atom':
                    selFunc = ((a, e) => {
                        return app.model.view([a.imgIndex]); // Just the one
                    });
                    break;
                case 'element':
                    // Selector function
                    selFunc = ((a, e) => {
                        var found = app.model._queryElements(a.element);
                        // We don't want periodic images here, so exclude:
                        if (dd_indices) {
                            found = found.filter((a, i) => dd_indices.includes(a));
                        }
                        return app.model.view(found);
                    });
                    break;
                case 'label':
                    // Selector function
                    selFunc = ((a, e) => {
                        var found = app.model._queryLabels([a.crystLabel]);
                        // We don't want periodic images here, so exclude:
                        if (dd_indices) {
                            found = found.filter((a, i) => dd_indices.includes(a));
                        }
                        return app.model.view(found);
                    });
                    break;
                case 'sphere':
                    const r = options.r;
                    selFunc = ((a, e) => {
                        var found = app.model._querySphere(a, r); 
                        // update displayed view if necessary
                        if (this.displayed !== app.model.view(found)) {
                            // union of displayed._indices and found lists
                            let new_indices = [...new Set([...this.displayed._indices, ...found])];

                            this.displayed = app.model.view(new_indices);
                        }
                        return app.model.view(found);
                    });
                    break;
                case 'molecule': 
                    selFunc = ((a, e) => {
                        var found = app.model._queryMolecule(a);
                        // update displayed view if necessary
                        if (this.displayed !== app.model.view(found)) {
                            // union of displayed._indices and found lists
                            let new_indices = [...new Set([...this.displayed._indices, ...found])];

                            this.displayed = app.model.view(new_indices);
                        }
                        return app.model.view(found);
                    });
                    break;
                case 'bonds':
                    const n = options.n;
                    selFunc = ((a, e) => {
                        var found = app.model._queryBonded(a, n, false);
                        found = found.concat([a.imgIndex]); // Crystvis excludes the original atom
                        // update displayed view if necessary
                        if (this.displayed !== app.model.view(found)) {
                            // union of displayed._indices and found lists
                            let new_indices = [...new Set([...this.displayed._indices, ...found])];

                            this.displayed = app.model.view(new_indices);
                        }
                        return app.model.view(found);
                    });
                    break;
                default:
                    // No selection at all
                    break;
            }
        }

        // We use this to guarantee that the selection still doesn't go out of
        // the default display (e.g. the main cell). Everything else remains
        // hidden or can be used as ghost for other purposes
        const intf = this;
        const handler = this.state.app_click_handler;

        if (selFunc) {
            handler.setCallback('sel', LC, (a, e) => { intf.selected = selFunc(a, e); });
            handler.setCallback('sel', SLC, (a, e) => { intf.selected = app.selected.or(selFunc(a, e)); });
            handler.setCallback('sel', CLC, (a, e) => { intf.selected = app.selected.remove(selFunc(a, e)); });
        }
        else {
            // Free the events
            handler.setCallback('sel', LC);
            handler.setCallback('sel', SLC);
            handler.setCallback('sel', CLC);
        }

        this.dispatch({type: 'update', data: {
            sel_mode: mode,
            sel_sphere_r: options.r,
            sel_bond_n: options.n,
            sel_on: options.on
        }});
    }

}

// Hook for interface
function useSelInterface() {
    let state = useSelector(makeSelector('sel', ['app_viewer', 'app_click_handler', 'app_default_displayed']), shallowEqual);
    let dispatcher = useDispatch();

    let intf = new SelInterface(state, dispatcher);

    return intf;
}


export default useSelInterface;
export { initialSelState };