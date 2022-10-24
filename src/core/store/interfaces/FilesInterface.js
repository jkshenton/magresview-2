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

import { shallowEqual, useSelector, useDispatch } from 'react-redux';

import { makeSelector, BaseInterface, getSel, getNMRData } from '../utils';
import { tableRow, eulerFromRotation, dipolarCoupling, jCoupling } from '../../../utils';

const initialFilesState = {
    files_seltype: 'ms',
    files_includeJ: false,
    files_includeD: false,
    files_includeEFG: true,
    files_includeMS: true,
    files_quadrupole_order: 2,
};

class FilesInterface extends BaseInterface {

    get fileType() {
        return this.state.files_seltype;
    }

    set fileType(v) {
        this.dispatch({
            type: 'set',
            key: 'files_seltype',
            value: v
        });
    }

    get fileName() {
        let app = this.state.app_viewer;
        let mname = app.modelName;
        let type = this.state.files_seltype;

        if (mname) {
            return `mvtable_${mname}_${type}.txt`;
        }
        else {
            return 'N/A';
        }
    }

    get fileValid() {
        // Can we generate a file with these parameters?
        let app = this.state.app_viewer;
        if (!app || !app.model)
            return false;

        switch(this.state.files_seltype) {
            case 'ms':
                return this.hasMSData;
            case 'efg':
                return this.hasEFGData;
            case 'isc':
                return this.hasISCData;
            case 'spinsys':
                return (this.hasMSData && this.spinSysIncludeMS) || (this.hasEFGData && this.spinSysIncludeEFG) || this.spinSysIncludeD || (this.hasISCData && this.spinSysIncludeJ);
            default:
                break;
        }

        return true;
    }

    get hasMSData() {
        let app = this.state.app_viewer;
        return (app && app.model && (app.model.hasArray('ms')));            
    }

    get hasEFGData() {
        let app = this.state.app_viewer;
        return (app && app.model && (app.model.hasArray('efg')));            
    }

    get hasISCData() {
        let app = this.state.app_viewer;
        return (app && app.model && (app.model.hasArray('isc')));        
    }

    get spinSysIncludeD() {
        return this.state.files_includeD;
    }

    set spinSysIncludeD(v) {
        this.dispatch({
            type: 'update',
            data: {
                files_includeD: v
            }
        });
    }

    get spinSysIncludeJ() {
        return this.state.files_includeJ;
    }

    set spinSysIncludeJ(v) {
        this.dispatch({
            type: 'update',
            data: {
                files_includeJ: v
            }
        });
    }
    
    get spinSysIncludeEFG() {
        return this.state.files_includeEFG;
    }

    set spinSysIncludeEFG(v) {
        this.dispatch({
            type: 'update',
            data: {
                files_includeEFG: v
            }
        });
    }

    get spinSysIncludeMS() {
        return this.state.files_includeMS;
    }

    set spinSysIncludeMS(v) {
        this.dispatch({
            type: 'update',
            data: {
                files_includeMS: v
            }
        });
    }

    get spinSysQuadrupoleOrder() {
        return this.state.files_quadrupole_order;
    }

    set spinSysQuadrupoleOrder(v) {
        this.dispatch({
            type: 'update',
            data: {
                files_quadrupole_order: v
            }
        });
    }

    get spinSysOptions() {
        return {
            includeD: this.state.files_includeD,
            includeJ: this.state.files_includeJ,
            includeEFG: this.state.files_includeEFG,
            includeMS: this.state.files_includeMS,
            quadrupoleOrder: this.spinSysQuadrupoleOrder
        };
        }
        



    generateFile() {

        let contents = '';

        // What are the atoms?
        const app = this.state.app_viewer;
        let view = null;

        if (app && app.model) {
            view = getSel(app);
        }

        if (!view) {
            return null;
        }

        switch(this.state.files_seltype) {
            case 'ms':
                contents = this._msMakeTable(view);
                break;
            case 'efg':
                contents = this._efgMakeTable(view);
                break;
            case 'dip':
                contents = this._dipMakeTable(view);
                break;
            case 'isc':
                contents = this._iscMakeTable(view);
                break;
            case 'spinsys':
                contents = this._spinsysMakeTable(view, this.spinSysOptions);
                break;
            default:
                return null;
        }

        return contents;
    }

    // Table generators
    _msMakeTable(view) {

        const tabW = 20;
        const prec = 5;
        const conv = this.state.eul_convention;

        let table = 'MS Table generated by MagresView 2\n';
        table += `Euler angles convention: ${conv}\n\n`;

        // Header
        table += tableRow(['Label', 'Element', 'Index', 's_iso/ppm', 
                           'Anisotropy/ppm', 'Asymmetry', 
                           'alpha', 'beta', 'gamma'], tabW);

        // Get the NMR data
        const iso = getNMRData(view, 'iso', 'ms')[1];
        const aniso = getNMRData(view, 'aniso', 'ms')[1];
        const asymm = getNMRData(view, 'asymm', 'ms')[1];

        // Euler angles
        const euler = view.atoms.map((a) => {
            const T = a.getArrayValue('ms');
            return eulerFromRotation(T.haeberlen_eigenvectors, conv).map((x) => (x*180.0/Math.PI));
        });

        view.atoms.forEach((a, i) => {
            table += tableRow([
                a.crystLabel,
                a.isotope + a.element,
                a.index + 1, // 1-indexed
                iso[i],
                aniso[i],
                asymm[i],
                euler[i][0],
                euler[i][1],
                euler[i][2]
            ], tabW, prec);
        });

        return table;
    }

    _efgMakeTable(view) {

        const tabW = 20;
        const prec = 5;
        const conv = this.state.eul_convention;

        let table = 'EFG Table generated by MagresView 2\n';
        table += `Euler angles convention: ${conv}\n\n`;

        // Header
        table += tableRow(['Label', 'Element', 'Index', 'Vzz/au', 'Anisotropy/au', 
                           'Asymmetry', 'Q/MHz', 
                           'alpha', 'beta', 'gamma'], tabW);

        // Get the NMR data
        const Vzz = getNMRData(view, 'e_z', 'efg')[1];
        const aniso = getNMRData(view, 'aniso', 'efg')[1];
        const asymm = getNMRData(view, 'asymm', 'efg')[1];
        const Q = getNMRData(view, 'Q', 'efg')[1] / 1e6; // Convert to MHz

        // Euler angles
        const euler = view.atoms.map((a) => {
            const T = a.getArrayValue('efg');
            return eulerFromRotation(T.haeberlen_eigenvectors, conv).map((x) => (x*180.0/Math.PI));
        });

        view.atoms.forEach((a, i) => {
            table += tableRow([
                a.crystLabel,
                a.isotope + a.element,
                a.index + 1, // 1-indexed
                Vzz[i],
                aniso[i],
                asymm[i],
                Q[i],
                euler[i][0],
                euler[i][1],
                euler[i][2]
            ], tabW, prec);
        });

        return table;
    }

    _dipMakeTable(view) {

        const tabW = 20;
        const prec = 5;

        let table = 'Dipolar coupling table generated by MagresView 2\n\n';

        // Header
        table += tableRow(['Label 1', 'Element 1', 'Index 1', 
                           'Label 2', 'Element 2', 'Index 2',
                           'D/kHz', 'r_x/Ang', 'r_y/Ang', 'r_z/Ang'], tabW);

        const atoms = view.atoms;

        atoms.forEach((a1, i) => {
            atoms.slice(i+1).forEach((a2, j) => {

                const [D, r] = dipolarCoupling(a1, a2);

                table += tableRow([
                    a1.crystLabel,
                    a1.isotope + a1.element,
                    a1.index + 1, // 1-indexed
                    a2.crystLabel,
                    a2.isotope + a2.element,
                    a2.index + 1, // 1-indexed
                    D,
                    r[0], r[1], r[2]
                ], tabW, prec);
            });
        });

        return table;
    }

    _iscMakeTable(view) {

        const tabW = 20;
        const prec = 5;

        let table = 'J coupling table generated by MagresView 2\n\n';

        // Header
        table += tableRow(['Label 1', 'Element 1', 'Index 1', 
                           'Label 2', 'Element 2', 'Index 2',
                           'J/Hz'], tabW);

        const atoms = view.atoms;

        atoms.forEach((a1, i) => {
            atoms.slice(i+1).forEach((a2, j) => {

                const J = jCoupling(a1, a2);

                if(!J)
                    return; // No data

                table += tableRow([
                    a1.crystLabel,
                    a1.isotope + a1.element,
                    a1.index + 1, // 1-indexed
                    a2.crystLabel,
                    a2.isotope + a2.element,
                    a2.index + 1, // 1-indexed
                    J
                ], tabW, prec);
            });
        });

        return table;
    }

    _spinsysMakeTable(view, options) {
        // properties can contain 'shift', 'quadrupole', 'dipole' and 'jcoupling'
        // Follow the soprano function here:
        // https://github.com/CCP-NC/soprano/blob/master/soprano/calculate/nmr/simpson.py

        const tabW = 20;
        const prec = 5;
        const conv = this.state.eul_convention;
        let table = '{spinsys\n';

        // channels: show unique isotopes + element label
        table += 'channels ';
        const nuclei = view.atoms.map((a) => (a.isotope + a.element));
        const isotopes = new Set(nuclei);
        table += Array.from(isotopes).join('    ');
        table += '\n'
        
        // nuclei
        table += '    nuclei ';
        table += nuclei.join('    ');
        table += '\n'

        if (options.includeMS) {

            // if there is no MS data, throw warning and skip
            if (!this.hasMSData) {
                console.warn('No MS data found. Skipping MS data in spinsys table.');
            } else {
                // Get the NMR data
                // isotropic shift
                const msiso = getNMRData(view, 'iso', 'ms')[1];
                // reduced anisotropy
                const msaniso = getNMRData(view, 'reduced_aniso', 'ms')[1];
                // asymmetry parameter
                const msasymm = getNMRData(view, 'asymm', 'ms')[1];
                // Euler angles
                // Euler angles
                const euler = view.atoms.map((a) => {
                    const T = a.getArrayValue('ms');
                    return eulerFromRotation(T.haeberlen_eigenvectors, conv).map((x) => (x*180.0/Math.PI));
                });

                view.atoms.forEach((a, i) => {
                    table += tableRow([
                        'shift',
                        i + 1, // 1-indexed
                        -msiso[i].toFixed(prec).toString()+'p',   // -isotropy (note minus sign!)
                        -msaniso[i].toFixed(prec).toString()+'p', // -reduced anisotropy (note minus sign!)
                        msasymm[i],  // asymmetry
                        euler[i][0], // alpha
                        euler[i][1], // beta
                        euler[i][2], // gamma
                    ], tabW, prec);
                });
            }
        } // end shift

        if (options.includeEFG) {
            if (!this.hasEFGData) {
                console.warn('No EFG data found. Skipping EFG data in spinsys table.');
            }
            else {
                // Get the NMR data
                // quadrupolar coupling
                const q_order = options.quadrupoleOrder;

                
                if (q_order > 0) {
                    if (q_order >2) {
                        console.warn('Warning: quadrupole order > 2 not supported')
                    }

                    const Q = getNMRData(view, 'Q', 'efg')[1]
                    const efgasym = getNMRData(view, 'asymm', 'efg')[1];
                    const efgeuler = view.atoms.map((a) => {
                        const T = a.getArrayValue('efg');
                        return eulerFromRotation(T.haeberlen_eigenvectors, conv).map((x) => (x*180.0/Math.PI));
                    });

                    view.atoms.forEach((a, i) => {
                        let cq = Q[i]
                        if (cq && cq !== 0.0) {
                            table += tableRow([
                                'quadrupole',
                                i + 1, // 1-indexed
                                q_order,
                                cq * 1e6, // quadrupolar coupling TODO: what units?? Currently Hz
                                efgasym[i],
                                efgeuler[i][0], // alpha
                                efgeuler[i][1], // beta
                                efgeuler[i][2], // gamma
                            ], tabW, prec);
                        }
                    });
                }
            }
        }

        if (options.includeD) {
            const atoms = view.atoms;
            atoms.forEach((a1, i) => {
                atoms.slice(i+1).forEach((a2, j) => {
                    let [D, r] = dipolarCoupling(a1, a2);
                    // angles TODO: check convention soprano has the angles the other way round
                    const a = Math.atan2(-r[1], -r[0]) % (2*Math.PI);
                    const b = Math.acos(-r[2]) % (2*Math.PI);
                    // convert to degrees
                    const a_deg = a*180.0/Math.PI;
                    const b_deg = b*180.0/Math.PI;

                    // convert D from Hz to rad/s
                    // soprano seems to do this, but MGV1 not...?
                    // D *= 2*Math.PI;

                    table += tableRow([
                        'dipole',
                        j + 1, // 1-indexed
                        i + 1, // 1-indexed
                        D,
                        a_deg,
                        b_deg,
                        0.0,
                    ], tabW, prec);
                });
            });
        }
        // TODO: what are the rest of the jcoupling columns ?
        // if (options.includeJ) {
            // if (!this.hasJData) {
            //     console.warn('No J data found. Skipping J data in spinsys table.');
            // }
            // else {
            //     const atoms = view.atoms;
            //     atoms.forEach((a1, i) => {
            //         atoms.slice(i+1).forEach((a2, j) => {
            //             const J = jCoupling(a1, a2);

            //             if(J) {

            //                 table += tableRow([
            //                     'jcoupling',
            //                     j + 1, // 1-indexed
            //                     i + 1, // 1-indexed
            //                     J
            //                 ], tabW, prec);
            //             }
            //         });
            //     });
            // }
        // }





        // add closing bracket
        table += '}';

        return table;
    }
}

// Hook for interface
function useFilesInterface() {
    let state = useSelector(makeSelector('files', ['app_viewer', 
                                                   'app_default_displayed', 
                                                   'eul_convention']), 
                            shallowEqual);
    let dispatcher = useDispatch();

    let intf = new FilesInterface(state, dispatcher);

    return intf;
}

export default useFilesInterface;
export { initialFilesState };