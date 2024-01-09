document.addEventListener('DOMContentLoaded', function () {
    const notesContainer = document.getElementById('notes-container');
    const startListeningBtn = document.getElementById('start-listening');
    const stopListeningBtn = document.getElementById('stop-listening');
    const saveNoteBtn = document.getElementById('save-note'); // Reference to the Save button
    const viewSavedNotesBtn = document.getElementById('view-saved-notes'); // Reference to the View Saved Notes button
    const clearAllNotesBtn = document.getElementById('clear-all-notes');
    clearAllNotesBtn.addEventListener('click', clearAllNotes);
    const fileInput = document.getElementById('file-input');
    const readFileBtn = document.getElementById('read-file');
    let recognition;
    fileInput.addEventListener('change', handleFileUpload);
    readFileBtn.addEventListener('click', readUploadedFile);
    function handleFileUpload(event) {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            // You can add additional checks here if needed
            speak('File uploaded successfully.');
        }
    }
    function readUploadedFile() {
        recognition = new webkitSpeechRecognition() || new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = function (event) {
            const result = event.results[event.results.length - 1];
            const transcript = result[0].transcript.trim().toLowerCase();

            if (transcript.includes('stop')) {
                stopReading();
            }

            const selectedFile = fileInput.files[0];
            if (selectedFile) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const fileContent = e.target.result;
                    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();

                    if (fileExtension === 'txt') {
                        // Handle TXT file
                        const text = new TextDecoder().decode(fileContent);
                        displayText(text);
                    } else if (fileExtension === 'docx') {
                        // Handle DOCX file
                        mammoth.extractRawText({ arrayBuffer: fileContent })
                            .then(displayExtractedText)
                            .catch(handleError);
                    } else {
                        speak('Unsupported file format. Please upload a TXT or DOCX file.');
                    }
                };
                reader.readAsArrayBuffer(selectedFile);
            } else {
                speak('Please upload a file first.');
            }
        };

        recognition.onend = function () {
            recognition.start();
        };

        recognition.start();
    }

    function displayExtractedText(result) {
        const extractedText = result.value || 'No text found in the document.';
        speak(extractedText);
    }

    function displayText(text) {
        speak(text);
    }

    function stopReading() {
        recognition.abort();
        speak('Reading stopped.');
    }

    function readNotes() {
        const notes = document.querySelectorAll('.note');
        if (notes.length === 0) {
            speak('No notes available.');
        } else {
            notes.forEach((note, index) => {
                const noteText = note.querySelector('p').innerText;
                speak(`Note ${index + 1}: ${noteText}`);
            });
        }
    }

    function handleError(error) {
        console.error('Error reading file:', error);
        speak('Error reading file. Please try again.');
    }

    function speak(text) {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);
        synth.speak(utterance);
    }

    /*function readUploadedFile() {
        const selectedFile = fileInput.files[0];
        if (selectedFile) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const fileContent = e.target.result;

                // Convert Word document to HTML using mammoth.js
                mammoth.extractRawText({ arrayBuffer: fileContent })
                    .then(displayExtractedText)
                    .catch(handleError);
            };
            reader.readAsArrayBuffer(selectedFile);
        } else {
            speak('Please upload a Word file first.');
        }
    }

    function displayExtractedText(result) {
        const extractedText = result.value || 'No text found in the document.';
        speak(extractedText);
    }

    function handleError(error) {
        console.error('Error reading file:', error);
        speak('Error reading file. Please try again.');
    }
    function speak(text) {
        const synth = window.speechSynthesis;

        // Create a new SpeechSynthesisUtterance
        const utterance = new SpeechSynthesisUtterance(text);

        // Set voice options if needed (optional)
        // const voices = synth.getVoices();
        // utterance.voice = voices[0]; // Example: set the voice to the first available voice

        // Speak the text
        synth.speak(utterance);
    }*/


    startListeningBtn.addEventListener('click', startListening);
    stopListeningBtn.addEventListener('click', stopListening);
    saveNoteBtn.addEventListener('click', saveNote); // Add event listener for the Save button
    viewSavedNotesBtn.addEventListener('click', viewSavedNotes); // Add event listener for the View Saved Notes button



    const downloadNotesBtn = document.getElementById('download-notes-btn');
    downloadNotesBtn.addEventListener('click', downloadNotes);

    function clearAllNotes() {
        const savedNotesList = document.getElementById('saved-notes-list');
        savedNotesList.innerHTML = ''; // Clear all saved notes from the list

        // Clear saved notes from localStorage
        localStorage.removeItem('notes');

        speak('All notes cleared successfully.');
    }

    function downloadNotes() {
        const savedNotes = JSON.parse(localStorage.getItem('notes')) || [];
        const notesContent = savedNotes.join('\n'); // Join notes with newline character

        // Create a Blob with the notes content
        const blob = new Blob([notesContent], { type: 'text/plain' });

        // Create a download link
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = 'my_notes.txt';

        // Append the link to the body, trigger the click, and remove the link
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }

    const editNotesBtn = document.getElementById('edit-notes-btn');
    const editNotesTextarea = document.getElementById('edit-notes-textarea');

    editNotesBtn.addEventListener('click', function () {
        const savedNotes = JSON.parse(localStorage.getItem('notes')) || [];
        editNotesTextarea.value = savedNotes.join('\n');
    });





    function startListening() {
        speak('started listening.');
        recognition = new webkitSpeechRecognition() || new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = function (event) {
            const result = event.results[event.results.length - 1];
            const transcript = result[0].transcript.trim();
            handleVoiceCommand(transcript);
        };

        recognition.start();
        startListeningBtn.disabled = true;
        stopListeningBtn.disabled = false;
    }

    function stopListening() {
        speak('stop listening.');
        if (recognition) {
            recognition.stop();
            startListeningBtn.disabled = false;
            stopListeningBtn.disabled = true;
        }
    }

    function handleVoiceCommand(command) {
        if (command.toLowerCase().includes('create note')) {
            createNote();
        } else if (command.toLowerCase().includes('delete note')) {
            deleteNote();
        } else if (command.toLowerCase().includes('read notes')) {
            readNotes();
        }
        else if (command.toLowerCase().includes('save notes')) {
            saveNote();
        }
    }






    //text area
    function createNote() {
        speak('please type your note in the text below.');
        const modal = document.getElementById('create-note-modal');
        const textarea = document.getElementById('note-textarea');

        modal.style.display = 'block';

        const okBtn = document.getElementById('modal-ok-btn');
        okBtn.addEventListener('click', function () {
            const noteContent = textarea.value;

            if (noteContent.trim() !== '') {
                const noteDiv = document.createElement('div');
                noteDiv.classList.add('note');
                noteDiv.innerHTML = `<p>${noteContent}</p>`;
                notesContainer.appendChild(noteDiv);
                speak('Note created successfully.');
            } else {
                speak('Note creation canceled.');
            }

            modal.style.display = 'none';
            textarea.value = ''; // Clear textarea for the next use
        });
    }


    //promp appears
    /*function createNote() {
        //stopListening(); // Stop listening temporarily to avoid capturing input while prompting
    
        const noteContent = prompt('Please type the content for the new note:');
        
        if (noteContent !== null && noteContent.trim() !== '') {
            const noteDiv = document.createElement('div');
            noteDiv.classList.add('note');
            noteDiv.innerHTML = `<p>${noteContent}</p>`;
            notesContainer.appendChild(noteDiv);
    
            speak('Note created successfully.');
        } else {
            speak('Note creation canceled.');
        }
    
        //startListening(); // Resume listening after prompting
    }*/


    function deleteNote() {
        const notes = document.querySelectorAll('.note');
        if (notes.length > 0) {
            const lastNote = notes[notes.length - 1];
            lastNote.remove();
        }
        speak('Note deleted successfully.');
    }





    function readNotes() {
        const notes = document.querySelectorAll('.note');
        if (notes.length === 0) {
            speak('No notes available.');
        } else {
            notes.forEach((note, index) => {
                const noteText = note.querySelector('p').innerText;
                speak(`Note ${index + 1}: ${noteText}`);
            });
        }
    }

    /*function saveNote() {
        const recognition = new webkitSpeechRecognition() || new SpeechRecognition();
        recognition.lang = 'en-US';
    
        recognition.onresult = function (event) {
            const result = event.results[event.results.length - 1];
            const transcript = result[0].transcript.trim().toLowerCase();
    
            if (transcript === 'save notes') {
                const lastNote = notesContainer.lastChild;
    
                if (lastNote) {
                    const noteText = lastNote.querySelector('p').innerText;
                    saveNoteToStorage(noteText);
                    speak('Note saved successfully.');
                } else {
                    speak('No note to save.');
                }
            }
        };
    
        recognition.start();
    }*/


    function saveNote() {
        const lastNote = notesContainer.lastChild;

        if (lastNote) {
            const noteText = lastNote.querySelector('p').innerText;
            saveNoteToStorage(noteText);
            speak('Note saved successfully.');
        } else {
            speak('No note to save.');
        }
    }

    function speak(text) {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);
        synth.speak(utterance);
    }
    function saveNoteToStorage(noteContent) {
        // Get existing notes from localStorage or initialize an empty array
        const savedNotes = JSON.parse(localStorage.getItem('notes')) || [];

        // Add the new note to the array
        savedNotes.push(noteContent);

        // Save the updated notes array back to localStorage
        localStorage.setItem('notes', JSON.stringify(savedNotes));
    }

    function viewSavedNotes() {
        const savedNotesModal = document.getElementById('saved-notes-modal');
        const savedNotesList = document.getElementById('saved-notes-list');

        // Clear existing notes in the modal
        savedNotesList.innerHTML = '';

        // Get existing notes from localStorage or initialize an empty array
        const savedNotes = JSON.parse(localStorage.getItem('notes')) || [];

        // Display saved notes in the modal
        savedNotes.forEach((noteContent, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = `Note ${index + 1}: ${noteContent}`;
            savedNotesList.appendChild(listItem);
        });

        // Show the modal
        savedNotesModal.style.display = 'block';
    }

    function closeModal() {
        const savedNotesModal = document.getElementById('saved-notes-modal');
        savedNotesModal.style.display = 'none';
    }

    // Close the modal if the user clicks outside of it or on the close button
    window.onclick = function (event) {
        const savedNotesModal = document.getElementById('saved-notes-modal');
        const closeBtn = document.querySelector('.close');

        if (event.target === savedNotesModal || event.target === closeBtn) {
            closeModal(); // Call the closeModal function
        }
    };
});
