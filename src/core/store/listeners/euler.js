/**
 * Listeners for Euler angles
 */

import { msColor, efgColor, dipColor, jcColor } from './colors';
import { eulerBetweenTensors } from '../../../utils';
import { dipolarTensor, jCoupling } from '../../../utils';
import { TensorData } from '@ccp-nc/crystvis-js/lib/tensor';


const ctable = {
    'ms': msColor,
    'efg': efgColor,
    'dipolarAB': dipColor,
    'jcoupling': jcColor,
    // grey for crystal
    'crystal': 0x808080
};

const DISKOPACITY = 0.8;
const DISKSCALE = 3.0;


function getTensorValues(atom1, tensor, atom2 = null) {
    // MS or EFG
    if (tensor === 'ms' || tensor === 'efg') {
        if (atom1.model.hasArray(tensor)) {
            return atom1.getArrayValue(tensor);
        }
    }
    // Dipolar
    else if (tensor === 'dipolarAB') {
        if (atom2) {
            // if atom1 is the same as atom2, return null
            if (atom1 === atom2) {
                return null;
            }

            // get dipolar tensor between A and B
            const D = dipolarTensor(atom1, atom2);
            return new TensorData(D);
        }
    }
    // J coupling
    else if (tensor === 'jcouplingAB') {
        //todo
        if (atom1.model.hasArray('isc')) {
            if (atom1 === atom2) {
                return null;
            }
            const J = jCoupling(atom1, atom2);
            return new TensorData(J);
        }
    }
    // Crystal
    else if (tensor === 'crystal') {
        // todo should this be atom1.model.cell or [[1,0,0],[0,1,0],[0,0,1]]?
        return new TensorData([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
    }

    return null;
}

function eulerAngleListener(state) {

    const a1A = state.eul_atom_A;
    const a1B = state.eul_atom_B;

    const a2A = state.eul_newatom_A;
    const a2B = state.eul_newatom_B;

    const tA = state.eul_tensor_A;
    const tB = state.eul_tensor_B;

    const conv = state.eul_convention;

    const orderA = state.eul_tensor_order_A;
    const orderB = state.eul_tensor_order_B;

    const equivalentAngleConfig = state.eul_equivalent_angle_config;


    let nmrA = null;
    let nmrB = null;

    if (a1A) {
        a1A.removeLabel('eulA');
        a1A.removeEulerDisks('eulAB');
    }

    if (a2A) {
        let r = a2A.radius;
        a2A.addLabel('A', 'eulA', {
            shift: [0, 0.25 * r, 0],
            color: ctable[tA],
            onOverlay: true,
            height: 0.04
        });

        // Now get the tensor value
        nmrA = getTensorValues(a2A, tA, a2B);
    }

    if (a1B) {
        a1B.removeLabel('eulB');
        a1A.removeEulerDisks('eulAB');
    }

    if (a2B) {
        let r = a2B.radius;
        a2B.addLabel('B', 'eulB', {
            shift: [0, -0.5 * r, 0],
            color: ctable[tB],
            onOverlay: true
        });

        // Now get the tensor value
        nmrB = getTensorValues(a2B, tB, a2A);
    }

    console.log('nmrA', nmrA)
    console.log('nmrB', nmrB)

    let results = null;
    let results1 = null;
    let all_equivalent_eulers = null;

    let pair_tensors = ['dipolarAB', 'jcouplingAB']
    let paired = (pair_tensors.includes(tA) || pair_tensors.includes(tB));

    let equiv_angle_index = equivalentAngleConfig[0] * 4 + equivalentAngleConfig[1];

    if (nmrA && nmrB) {
        // ensure the order is set correctly
        nmrA.convention = orderA;
        nmrB.convention = orderB;
        // Get the eigenvectors
        results1 = eulerBetweenTensors(nmrA, nmrB, conv, orderA, orderB);
        results = nmrA.eulerTo(nmrB, conv) //this one is in crystalvis-js and should be more robust to edge cases
        console.log('results', results.map(x => x * 180 / Math.PI))
        console.log('results1', results1.map(x => x * 180 / Math.PI))
        // get equivalent euler angle set:
        all_equivalent_eulers = nmrA.equivalentEulerTo(nmrB, conv, true, 1e-6, false)
        results = all_equivalent_eulers[equiv_angle_index];
        console.log('equivalent eulers', all_equivalent_eulers.map(x => x.map(y => y * 180 / Math.PI)))
        // TODO these now agree(though not with euler disk approach!)

        // visualise the euler angles
        // if A and B are the same, but tA != tB, 
        // we can draw the Euler disks
        if (a2A === a2B && !paired) {
            // make sure nmrA is not equal to nmrB
            // TODO re-enable this after pushing to gh-pages
            if (tA !== tB) {
                a2A.addEulerDisks(
                    {
                        dataA: nmrA,
                        dataB: nmrB,
                        conventionA: orderA,
                        conventionB: orderB
                    }, // data
                    'eulAB', // name
                    { // parameters
                        scalingFactor: DISKSCALE,
                        color1: ctable[tA],
                        color2: ctable[tB],
                        opacity: DISKOPACITY,
                        equivalentAngleConfig: equivalentAngleConfig
                    }
                )
            }

        } else if (paired) {
            // draw the Euler disks on atom A
            a2A.addEulerDisks(
                {
                    dataA: nmrA,
                    dataB: nmrB,
                    conventionA: orderA,
                    conventionB: orderB
                }, // data
                'eulAB', // name
                { // parameters
                    scalingFactor: DISKSCALE,
                    color1: ctable[tA],
                    color2: ctable[tB],
                    opacity: DISKOPACITY
                }
            )
        }
        else {
            // remove the disks
            a2A.removeEulerDisks('eulAB');
        }
    }

    return {
        eul_atom_A: a2A,
        eul_atom_B: a2B,
        eul_results: results,
        eul_equivalent_angles: all_equivalent_eulers,
        eul_tensor_A_values: nmrA,
        eul_tensor_B_values: nmrB,
    };
}

export { eulerAngleListener };