

window.addEventListener('load', function()
{
    let colors = ['#D91313', '#DE6817', '#DF7F0D', '#9CD523', '#0E9E09', '#3FC48A', '#1DC9B5', '#2A62CE', '#7F4CD4', '#C04CD4', '#E55EC2', '#E54783'];
    let noteOptions = ['C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B'];
    let intervalNames = ['1', 'm2', '2', 'm3', '3', '4', 'b5', '5', '#5', '6', 'm7', '7'];

    let numFrets = 22;
    let numStrings = 6;
    let scaleRoot = 0;
    let scale = [true, false, true, false, true, true, false, true, false, true, false, true];
    let scaleDegrees = generateScaleDegrees(scale);
    let scaleNoteNames = generateNoteNames(scale);
    let tuning = [40, 45, 50, 55, 59, 64];
    let highlightStart = 0;
    let highlightEnd = numFrets;

    let fretboard = generateFretboard();
    document.body.appendChild(fretboard);

    let numStringsInput = document.getElementById('numstrings');
    let tuningContainer = document.getElementById('tuning');
    let scaleRootInput = document.getElementById('scaleroot');
    let scaleNotesContainer = document.getElementById('scalenotes');
    let highlightStartInput = document.getElementById('highlightstart');
    let highlightEndInput = document.getElementById('highlightend');
    let saveNameInput = document.getElementById('savename');
    let loadListSelect = document.getElementById('loadlist');
    let jsonInput = document.getElementById('json');

    numStringsInput.onchange = onNumStringsChanged;
    scaleRootInput.onchange = onScaleRootChanged;
    highlightStartInput.onchange = onHighlightChanged;
    highlightEndInput.onchange = onHighlightChanged;

    document.getElementById('prevmode').onclick = function() { cycleMode(-1); };
    document.getElementById('nextmode').onclick = function() { cycleMode(1); };
    document.getElementById('save').onclick = save;
    document.getElementById('load').onclick = load;
    document.getElementById('delete').onclick = deleteSave;

    generateTuningInputs();
    generateScaleNoteInputs();
    populateLoadList();

    updateUI();

    function generateScaleDegrees(scale)
    {
        let degrees = [];
        let degree = 1;
        for (let i = 0; i < 12; i++)
        {
            degrees.push(degree);
            if (scale[i])
            {
                degree++;
            }
        }
        return degrees;
    }

    function generateNoteNames(scale)
    {
        let sharps = 0;
        let flats = 0;
        let scaleI = (12 - scaleRoot) % 12;
        for (let i = 0; i < 12; i++)
        {
            let name = noteOptions[i];
            if (scale[scaleI] && name.indexOf('/') >= 0)
            {
                if (!scale[(scaleI + 11) % 12])
                {
                    sharps++;
                }
                if (!scale[(scaleI + 1) % 12])
                {
                    flats++;
                }
            }
            scaleI = (scaleI + 1) % 12;
        }

        let choice = sharps <= flats ? 1 : 0;
        let scaleNoteNames = [];
        for (let i = 0; i < 12; i++)
        {
            let name = noteOptions[i];
            if (name.indexOf('/') >= 0)
            {
                name = name.split('/')[choice];
            }
            scaleNoteNames.push(name);
        }

        return scaleNoteNames;
    }

    function cycleMode(i)
    {
        let step = 1;
        while (!scale[step])
        {
            step++;
        }
        scaleRoot = (scaleRoot + step) % 12;
        for (let i = 0; i < step; i++)
        {
            scale.push(scale.shift());
        }
        scaleDegrees = generateScaleDegrees(scale);
        scaleNoteNames = generateNoteNames(scale);
        updateUI();
        updateFretboard();
    }


    function generateFretboard()
    {
        let fretboard = document.createElement('div');
        fretboard.setAttribute('class', 'fretboard');
        fretboard.style.height = (numStrings * 30) + 'px';
        
        let fretPositions = [0];
        let lastPos = 0;
        for (let i = 0; i < numFrets; i++)
        {
            let pos = lastPos + (100 - lastPos) / 17.817;
            lastPos = pos;
            fretPositions.push(pos);
        }
        
        let length = 100 - lastPos;
        
        for (let i = 1; i < fretPositions.length; i++)
        {
            fretPositions[i] *= 100 / lastPos;
        }
        
        for (let i = 0; i < fretPositions.length; i++)
        {
            let pos = lastPos + (100 - lastPos) / 17.817;
            lastPos = pos;
            let fret = document.createElement('div');
            fret.setAttribute('class', 'fret');
            fret.style.width = i == 0 ? '4px' : '2px';
            fret.style.left = fretPositions[i] + '%';
            fretboard.appendChild(fret);
        }
        
        let stringPositions = [];
        
        for (let i = 0; i < numStrings; i++)
        {
            stringPositions.push(i / (numStrings - 1) * 100);
            let string = document.createElement('div');
            string.setAttribute('class', 'string');
            string.style.bottom = stringPositions[i] + '%';
            fretboard.appendChild(string);
            
        }
        
        function makeDot(fret)
        {
            let middle = Math.floor(numStrings / 2) - 1;
            let numDots = fret == 12 ? 2 : 1;
            for (let i = 0; i < numDots; i++)
            {
                let dot = document.createElement('div');
                dot.setAttribute('class', 'dot');
                dot.style.left = (fretPositions[fret - 1] + fretPositions[fret]) / 2 + '%';
                if (numDots > 1)
                {
                    dot.style.bottom = (stringPositions[middle - 1 + i * 2] + stringPositions[middle + i * 2]) / 2 + '%';
                }
                else
                {
                    dot.style.bottom = (stringPositions[middle] + stringPositions[middle + 1]) / 2 + '%';
                }
                
                fretboard.appendChild(dot);
            }
        }

        makeDot(3);
        makeDot(5);
        makeDot(7);
        makeDot(9);
        makeDot(12);
        makeDot(15);
        makeDot(17);
        makeDot(19);

        for (let s = 0; s < numStrings; s++)
        {
            let noteNum = tuning[s];
            for (let f = 0; f < numFrets + 1; f++)
            {
                let noteI = noteNum % 12;
                let octaveI = Math.floor(noteNum / 12) - 1;
                let scaleOffset = (noteNum - scaleRoot) % 12;
                let note = document.createElement('div');
                note.setAttribute('class', 'note');
                note.style.left = fretPositions[f] + '%';
                note.style.bottom = stringPositions[s] + '%';
                note.style.visibility = scale[scaleOffset] ? 'visible' : 'hidden';
                note.style.backgroundColor = colors[scaleOffset];
                let highlighted = f >= highlightStart && f <= highlightEnd;
                note.style.opacity = highlighted ? '100%' : '33%';
                note.textContent = intervalNames[scaleOffset];
                note.title = scaleNoteNames[noteI] + octaveI;
                fretboard.appendChild(note);
                noteNum++;
            }
        }

        return fretboard;
    }

    function makeNoteSelect()
    {
        let select = document.createElement('select');
        select.onchange = onTuningChanged;
        for (let i = 0; i < 12; i++)
        {
            let option = document.createElement('option');
            option.value = i;
            option.textContent = noteOptions[i];
            select.appendChild(option);
        }
        return select;
    }

    function generateTuningInputs()
    {
        while (tuningContainer.children.length > numStrings)
        {
            tuningContainer.firstElementChild.remove();
        }

        for (let i = tuningContainer.children.length; i < numStrings; i++)
        {
            let noteContainer = document.createElement('span');
            let noteSelect = makeNoteSelect();
            let octaveInput = document.createElement('input');
            octaveInput.type = 'number';
            octaveInput.value = 2;
            octaveInput.size = 3;
            octaveInput.onchange = onTuningChanged;
            noteContainer.appendChild(noteSelect);
            noteContainer.appendChild(octaveInput);
            tuningContainer.insertBefore(noteContainer, tuningContainer.firstElementChild);
        }
    }

    function generateScaleNoteInputs()
    {
        for (let i = 0; i < 11; i++)
        {
            let noteInput = document.createElement('input');
            noteInput.type = 'checkbox';
            noteInput.onchange = onScaleNotesChanged;
            scaleNotesContainer.appendChild(noteInput);
        }
    }

    function updateUI()
    {
        numStringsInput.value = numStrings;
        for (let i = 0; i < numStrings; i++)
        {
            let noteI = tuning[i] % 12;
            let octaveI = Math.floor(tuning[i] / 12) - 1;
            let noteContainer = tuningContainer.children[i];
            let noteSelect = noteContainer.children[0];
            let octaveInput = noteContainer.children[1];
            noteSelect.value = noteI;
            octaveInput.value = octaveI;
        }

        scaleRootInput.value = scaleRoot;
        for (let i = 0; i < 11; i++)
        {
            scaleNotesContainer.children[i].checked = scale[i + 1];
        }

        highlightStartInput.value = highlightStart;
        highlightEndInput.value = highlightEnd;
    }

    function onNumStringsChanged()
    {
        numStrings = numStringsInput.value;
        generateTuningInputs();
        onTuningChanged();
        updateFretboard();
    }

    function onTuningChanged()
    {
        for (let i = 0; i < numStrings; i++)
        {
            let noteContainer = tuningContainer.children[i];
            let noteI = noteContainer.children[0].value;
            let octaveI = noteContainer.children[1].value;
            tuning[i] = 12 * (octaveI + 1) + noteI;
        }
        updateFretboard();
    }

    function onScaleRootChanged()
    {
        scaleRoot = scaleRootInput.value;
        scaleDegrees = generateScaleDegrees(scale);
        scaleNoteNames = generateNoteNames(scale);
        updateFretboard();
    }

    function onScaleNotesChanged()
    {
        for (let i = 0; i < 11; i++)
        {
            scale[i + 1] = scaleNotesContainer.children[i].checked;
        }
        scaleDegrees = generateScaleDegrees(scale);
        scaleNoteNames = generateNoteNames(scale);
        updateFretboard();
    }

    function onHighlightChanged()
    {
        highlightStart = highlightStartInput.value;
        highlightEnd = highlightEndInput.value;
        updateFretboard();
    }

    function updateFretboard()
    {
        let newFretboard = generateFretboard();
        fretboard.replaceWith(newFretboard);
        fretboard = newFretboard;
    }

    function toJSON()
    {
        return JSON.stringify({
            'numFrets': numFrets,
            'numStrings': numStrings,
            'scaleRoot': scaleRoot,
            'scale': scale,
            'tuning': tuning,
            'highlightStart': highlightStart,
            'highlightEnd': highlightEnd
            });
    }

    function loadJSON(json)
    {
        let data = JSON.parse(json);
        numFrets = data.numFrets;
        numStrings = data.numStrings;
        scaleRoot = data.scaleRoot;
        scale = data.scale;
        scaleDegrees = generateScaleDegrees(scale);
        scaleNoteNames = generateNoteNames(scale);
        tuning = data.tuning;
        highlightStart = data.highlightStart;
        highlightEnd = data.highlightEnd;
        updateUI();
        updateFretboard();
    }

    function populateLoadList()
    {
        let storage = window.localStorage;

        loadListSelect.replaceChildren();
        for (let i = 0; i < storage.length; i++)
        {
            let name = storage.key(i);
            let option = document.createElement('option');
            option.value = option.textContent = name;
            loadListSelect.appendChild(option);
        }
    }

    function save()
    {
        let storage = window.localStorage;

        let name = saveNameInput.value;
        if (name == '')
        {
            let saveI = 1;
            while (storage.getItem('Save ' + saveI) != null)
            {
                saveI++;
            }
            name = 'Save ' + saveI;
            saveNameInput.value = name;
        }
        let json = toJSON();
        storage.setItem(name, json);
        jsonInput.value = json;
        populateLoadList();
    }

    function load()
    {
        let storage = window.localStorage;

        let name = loadListSelect.value;
        let json = storage.getItem(name);
        if (json != null)
        {
            loadJSON(json);
            jsonInput.value = json;
        }
        saveNameInput.value = name;
    }

    function deleteSave()
    {
        let storage = window.localStorage;

        storage.removeItem(loadListSelect.value);
        populateLoadList();
    }
});
