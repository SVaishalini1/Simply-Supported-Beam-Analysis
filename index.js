
function getInputValue(id) {
    return parseFloat(document.getElementById(id).value);
}


function displayError(message) {
    const errorElement = document.getElementById('Error');
    errorElement.textContent = message;
    
    Plotly.purge('sfdModalPlotArea'); 
    Plotly.purge('bmdModalPlotArea'); 
    Plotly.purge('Plot_SFD_Comparison');
    Plotly.purge('Plot_BMD_Comparison');
    document.getElementById('results').textContent = ''; 
}


function clearError() {
    document.getElementById('Error').textContent = '';
}


function validateInputs(p, a, l, x = null, a_prime = null) {
    clearError();
    if (isNaN(p) || p <= 0) {
        displayError('Error: Value of P must be a positive number.');
        return false;
    }
    if (isNaN(a) || a <= 0) {
        displayError('Error: Value of \'a\' must be a positive number.');
        return false;
    }
    if (isNaN(l) || l <= 0) {
        displayError('Error: Length \'L\' must be a positive number.');
        return false;
    }
    if (a >= l) {
        displayError('Error: Distance \'a\' must be less than Length \'L\'.');
        return false;
    }

    if (x !== null && (isNaN(x) || x < 0 || x > l)) {
        displayError(`Error: Point 'x' must be between 0 and ${l.toFixed(2)} m.`);
        return false;
    }

    if (a_prime !== null && (isNaN(a_prime) || a_prime <= 0 || a_prime >= l)) {
        displayError(`Error: Comparison 'a' value must be a positive number less than ${l.toFixed(2)} m.`);
        return false;
    }

    return true;
}

// Function to generate Shear Force Diagram (SFD)
function generateSFD() {
    const p = getInputValue('p');
    const a = getInputValue('a');
    const l = getInputValue('l');

   
    if (!validateInputs(p, a, l)) {
       
        Plotly.purge('sfdModalPlotArea'); 

        const sfdModalElement = document.getElementById('generate-sfd-modal');
        const modalInstance = bootstrap.Modal.getInstance(sfdModalElement);
        if (modalInstance) {
            modalInstance.hide();
        }
        return;
    }
    
    const b = l - a;
    const upper_shear = (p * b) / l;
    const lower_shear = (-1 * p * a) / l;

    const xArray = [0, 0, a, a, a, l, l];
    const yArray = [0, upper_shear, upper_shear, 0, lower_shear, lower_shear, 0];

    const data = [{
        x: xArray,
        y: yArray,
        mode: "lines+markers",
        type: 'scatter',
        fill: 'tozeroy',
        fillcolor: 'rgba(0, 123, 255, 0.2)',
        line: { color: '#007bff' },
        name: 'Shear Force'
    }];

    const layout = {
        xaxis: { range: [0, l * 1.1], title: 'Distance from Left End (m)', zeroline: true, zerolinewidth: 2, zerolinecolor: '#ccc' },
        yaxis: { range: [Math.min(0, lower_shear * 1.2), upper_shear * 1.2], title: 'Shear Force (kN)', zeroline: true, zerolinewidth: 2, zerolinecolor: '#ccc' },
        title: {
            text: "Shear Force Diagram (SFD)",
            font: { size: 24, color: '#343a40' }
        },
        plot_bgcolor: '#e9ecef',
        paper_bgcolor: '#ffffff',
        margin: { t: 60, b: 60, l: 60, r: 40 },
        hovermode: 'closest',
        showlegend: false
    };

    Plotly.newPlot("sfdModalPlotArea", data, layout); 
}

// Function to generate Bending Moment Diagram (BMD)
function graph_BMD() {
    const p = getInputValue('p');
    const a = getInputValue('a');
    const l = getInputValue('l');

    if (!validateInputs(p, a, l)) {
        
        Plotly.purge('bmdModalPlotArea'); 
        const bmdModalElement = document.getElementById('generate-bmd-modal');
        const modalInstance = bootstrap.Modal.getInstance(bmdModalElement);
        if (modalInstance) {
            modalInstance.hide();
        }
        return;
    }

    const b = l - a;
    const max_moment = (p * a * b) / l;

    const xAxis = [0, a, l];
    const yAxis = [0, max_moment, 0];

    const data_moment = [{
        x: xAxis,
        y: yAxis,
        mode: "lines+markers",
        type: 'scatter',
        fill: 'tozeroy',
        fillcolor: 'rgba(0, 123, 255, 0.2)',
        line: { color: '#007bff' },
        name: 'Bending Moment'
    }];

    const layout_moment = {
        xaxis: { range: [0, l * 1.1], title: 'Distance from Left End (m)', zeroline: true, zerolinewidth: 2, zerolinecolor: '#ccc' },
        yaxis: { range: [0, max_moment * 1.2], title: 'Bending Moment (kNm)', zeroline: true, zerolinewidth: 2, zerolinecolor: '#ccc' },
        title: {
            text: "Bending Moment Diagram (BMD)",
            font: { size: 24, color: '#343a40' }
        },
        plot_bgcolor: '#e9ecef',
        paper_bgcolor: '#ffffff',
        margin: { t: 60, b: 60, l: 60, r: 40 },
        hovermode: 'closest',
        showlegend: false
    };

    Plotly.newPlot("bmdModalPlotArea", data_moment, layout_moment); 
}

// Function to calculate SFD and BMD at a specific point
function specificPoint() {
    const p = getInputValue('p');
    const a = getInputValue('a');
    const l = getInputValue('l');
    const x = getInputValue('ppa');

    if (!validateInputs(p, a, l, x)) {
        document.getElementById('results').textContent = '';
        return;
    }

    const b = l - a;
    let sfd, bmd;
    const epsilon = 1e-9; 

    if (x >= 0 && x <= a + epsilon) {
        sfd = (p * b) / l;
        bmd = (p * b * x) / l;
    } else if (x > a + epsilon && x <= l + epsilon) {
        sfd = (-p * a) / l;
        bmd = p * a - (p * a * x) / l;
    } else {
        displayError('Point "x" is out of beam range (0 to L).');
        document.getElementById('results').textContent = '';
        return;
    }

    if (Math.abs(x - 0) < epsilon) {
        sfd = (p * b) / l;
        bmd = 0;
    } else if (Math.abs(x - l) < epsilon) {
        sfd = (-p * a) / l;
        bmd = 0;
    } else if (Math.abs(x - a) < epsilon) {
        sfd = (p * b) / l;
        bmd = (p * b * a) / l;
    }

    document.getElementById('results').innerHTML = `At x = ${x.toFixed(2)} m:<br>Shear Force (SFD): ${sfd.toFixed(3)} kN<br>Bending Moment (BMD): ${bmd.toFixed(3)} kNm`;
}



// Function to reset all inputs, plots, and messages
function resetCalculator() {

    document.getElementById('p').value = '';
    document.getElementById('a').value = '';
    document.getElementById('l').value = '';
    document.getElementById('ppa').value = '';
    document.getElementById('var_inp').value = '';

   
    Plotly.purge('sfdModalPlotArea'); 
    Plotly.purge('bmdModalPlotArea'); 

    clearError();
    document.getElementById('results').textContent = '';
}


// --- Event Listeners ---

// Get modal elements
const sfdModalElement = document.getElementById('generate-sfd-modal');
const bmdModalElement = document.getElementById('generate-bmd-modal'); // Get BMD modal element

// SFD Modal Event Listeners
sfdModalElement.addEventListener('shown.bs.modal', generateSFD);
sfdModalElement.addEventListener('hidden.bs.modal', function () {
    Plotly.purge('sfdModalPlotArea');
});

// BMD Modal Event Listeners (New)
bmdModalElement.addEventListener('shown.bs.modal', graph_BMD); // Trigger BMD graph when its modal is shown
bmdModalElement.addEventListener('hidden.bs.modal', function () {
    Plotly.purge('bmdModalPlotArea'); // Purge BMD graph when its modal is hidden
});


document.getElementById('Submit').addEventListener('click', specificPoint);
document.getElementById('resetInputs').addEventListener('click', resetCalculator);

// Initial clear of error and results on page load
document.addEventListener('DOMContentLoaded', () => {
    clearError();
    document.getElementById('results').textContent = '';
});