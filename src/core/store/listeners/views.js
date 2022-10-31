import { centerDisplayed } from '../../../utils';

function viewsListener(state) {

    let app = state.app_viewer;
    let model = app.model;

    if (!model) {
        return {};
    }

    // Aliases
    let sel = state.sel_selected_view;
    let displ = state.sel_displayed_view? state.sel_displayed_view : state.app_default_displayed;

    // Assign new selection
    if (sel && sel !== app.selected)
        app.selected = sel;

    if (model)
        model.all.hide();

    // Deal with ghosts
    Object.values(state.sel_ghosts_requests).forEach((s, i) => {
        // Make each of these visible but translucent
        s.show();
        s.setProperty('opacity', 0.5);
    });
    
    // Doing this after the ghosts means any overlap will be fixed here
    app.displayed = displ;
    displ.setProperty('opacity', 1.0);

    // Center model   
    if (sel && sel === displ) {
        console.log('centering');
        // Center on the displayed view
        centerDisplayed(app);
    }

    // We now update all visualizations that may be changed as a result of this
    return  {};
}

export { viewsListener };