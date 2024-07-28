// GAME STATE

let votesChart = null;
let timesChart = null;
let turnCounter = 0;
let autopilot = false;

const MAX_CHAR_LIMIT = 256;

const agentColors = [
    'rgba(54, 162, 235, 0.2)',
    'rgba(255, 206, 86, 0.2)',
    'rgba(75, 192, 192, 0.2)',
    'rgba(153, 102, 255, 0.2)',
    'rgba(255, 159, 64, 0.2)',
    'rgba(255, 99, 132, 0.2)'
];

let totalAgents = 0;

// EVENT LISTENERS
document.getElementById('startGame').addEventListener('click', async () => {
    startGame();
});

document.getElementById('nextTurn').addEventListener('click', async () => {
    await executeTurn();
});

document.getElementById('autopilot').addEventListener('change', (event) => {
    autopilot = event.target.checked;
    if (autopilot) {
        if (turnCounter === 0) {
            startGame();
        } else {
            runAutopilot();
        }
    }
});

/**
 * Executes a turn in the game by sending a request to the server and updating the UI accordingly.
 *
 * @return {Promise<void>} A promise that resolves when the turn has been executed.
 */
const executeTurn = async () => {
    // Set the status message and disable buttons
    setStatusMessage('Processing turn...', true);
    disableButtons();

    try {
        // Send a POST request to the server to execute a turn
        const response = await fetch('http://localhost:3000/turn', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            // Update the UI with the data received from the server
            const data = await response.json();
            updateChat(data.messageHistory);
            updateVotesChart(data.votes);
            updateEvalTimesChart(data.totalEvalTimes);

            turnCounter = data.turnCounter;

            updateTurnCounter();

            if (data.endCondition) {
                // Disable buttons and show the loser
                document.getElementById('nextTurn').disabled = true;
                document.getElementById('autopilot').disabled = true;
                document.getElementById('startGame').disabled = false;
                showLoser(data.loser);
                setStatusMessage('Game over.');
            } else {
                // Re-enable autopilot if it's enabled
                setStatusMessage('Turn completed.');
                if (autopilot) {
                    runAutopilot();
                }
            }
        } else {
            // Show an error message if there was an error during the turn
            alert('Error during turn.');
        }
    } finally {
        // Enable buttons if autopilot is not enabled
        if (!autopilot) {
            enableButtons();
        }
    }
};

/**
 * Executes a turn automatically if the autopilot checkbox is checked.
 * 
 * This function is called when the autopilot checkbox is changed. It checks if the checkbox is
 * checked and if so, it calls the `executeTurn` function to run a turn.
 */
const runAutopilot = async () => {
    // Get the current state of the autopilot checkbox
    autopilot = document.getElementById('autopilot').checked;

    // If the autopilot checkbox is checked, execute a turn
    if (autopilot) {
        await executeTurn();
    }
};


/**
 * Processes a message and returns a formatted string.
 *
 * This function takes a message object as input and attempts to parse its content as JSON. If the
 * parsing is successful, it returns a formatted string containing the keys and values of the parsed
 * JSON object. If parsing fails, it returns a simple string containing the name and content of the
 * message.
 *
 * @param {Object} message - The message object to process.
 * @return {string} A formatted string representing the message.
 */
const processMessage = (message) => {
    try {
        // Attempt to parse the message content as JSON
        const structuredMessage = JSON.parse(message.content);

        // Generate a formatted string from the parsed JSON object
        return `${Object.keys(structuredMessage)
            .map(key => `<b>${key}</b>: ${structuredMessage[key]}`)
            .join('<br>')}`;
    } catch (error) {
        // If parsing fails, return a simple string containing the name and content of the message
        return `<b>${message.name}</b>: ${message.content}`;
    }
};

/**
 * Updates the chat box with the provided message history.
 *
 * @param {Array} messageHistory - An array of message objects.
 */
const updateChat = (messageHistory) => {
    // Get the chat box element
    const chatBox = document.getElementById('chat');

    // Clear the chat box
    chatBox.innerHTML = '';

    // Initialize agent message number
    let agentMessageNo = 0;

    // Iterate over each message in the message history
    messageHistory.forEach(message => {
        // Create a new message element
        const messageElement = document.createElement('div');

        // Set the class name of the message element
        messageElement.className = 'message ' + (message.role === 'system' ? 'system' : 'agent');

        // Set the background color of the message element if it is an agent message
        if (message.role !== 'system') {
            messageElement.style.backgroundColor = agentColors[agentMessageNo];
            agentMessageNo = (agentMessageNo + 1) % totalAgents;
        }

        // Create an icon element
        const iconElement = document.createElement('span');
        iconElement.className = 'icon';
        iconElement.textContent = getIcon(message.name); // Set the icon element's text content

        // Create a content element
        const contentElement = document.createElement('span');
        const fullMessage = processMessage(message); // Process the message
        let displayMessage = fullMessage;

        // Check if the full message is longer than the maximum character limit
        if (fullMessage.length > MAX_CHAR_LIMIT) {
            displayMessage = fullMessage.substring(0, MAX_CHAR_LIMIT) + '... ';
            const readMoreLink = document.createElement('a');
            readMoreLink.href = '#';
            readMoreLink.textContent = 'Read more';
            readMoreLink.className = 'read-more-link';
            readMoreLink.onclick = function (e) {
                e.preventDefault();
                if (readMoreLink.textContent === 'Read more') {
                    contentElement.innerHTML = fullMessage + ' ';
                    readMoreLink.textContent = 'Collapse';
                } else {
                    contentElement.innerHTML = displayMessage + ' ';
                    readMoreLink.textContent = 'Read more';
                }
            };
            contentElement.innerHTML = displayMessage;
            contentElement.appendChild(readMoreLink);
        } else {
            contentElement.innerHTML = fullMessage;
        }

        // Append the icon and content elements to the message element
        messageElement.appendChild(iconElement);
        messageElement.appendChild(contentElement);

        // Append the message element to the chat box
        chatBox.appendChild(messageElement);
    });

    // Scroll the chat box to the bottom
    chatBox.scrollTop = chatBox.scrollHeight;
};

/**
 * Returns the first character of the given name in uppercase.
 * This is used as an icon for the agent.
 *
 * @param {string} name - The name of the agent.
 * @return {string} The uppercase first character of the name.
 */
const getIcon = (name) => {
    // Split the name into an array of characters and get the first character.
    // Then, convert it to uppercase.
    return name.split('')[0].toUpperCase();
};

/**
 * Updates the votes chart with the given votes data.
 * If the chart already exists, it updates the data.
 * Otherwise, it creates a new chart.
 *
 * @param {object} votes - The votes data, with each key representing an agent and the value being an object with a 'against' property.
 */
const updateVotesChart = (votes) => {
    const ctx = document.getElementById('votesChart').getContext('2d');

    // Update chart if it exists
    if (votesChart) { 
        // Update the data with the votes against each agent
        votesChart.data.datasets[0].data = Object.values(votes).map(vote => vote.against);
        // Update the chart
        votesChart.update();
        return;
    }

    // Create a new chart if it doesn't exist
    votesChart = new Chart(ctx, {
        type: 'bar', // Chart type
        data: { // Chart data
            labels: Object.keys(votes), // Agent names as labels
            datasets: [{ // Chart dataset
                label: 'Votes Against', // Dataset label
                data: Object.values(votes).map(vote => vote.against), // Votes against each agent
                backgroundColor: agentColors // Agent colors for the chart bars
            }]
        },
        options: { // Chart options
            scales: {
                y: { // Y-axis options
                    beginAtZero: true, // Start at zero
                    max: 3, // Maximum value on the y-axis
                    ticks: {
                        stepSize: 1 // Step size for tick marks
                    }
                }
            }
        }
    });
};

/**
 * Updates the evaluation times chart with the given total evaluation times.
 * If the chart already exists, it updates the data and redraws the chart.
 * Otherwise, it creates a new chart.
 *
 * @param {Object} totalEvalTimes - An object containing the total evaluation times for each agent.
 * The keys of the object are the agent names, and the values are the total evaluation times.
 */
const updateEvalTimesChart = (totalEvalTimes) => {
    // Get the canvas context for the evaluation times chart
    const ctx = document.getElementById('evalTimesChart').getContext('2d');

    // Update chart if it exists
    if (timesChart) { 
        // Update the data with the new total evaluation times
        timesChart.data.datasets[0].data = Object.values(totalEvalTimes);
        // Update the chart
        timesChart.update();
        return;
    }

    // Create a new chart if it doesn't exist
    timesChart = new Chart(ctx, {
        type: 'bar', // Chart type
        data: { // Chart data
            labels: Object.keys(totalEvalTimes), // Agent names as labels
            datasets: [{ // Chart dataset
                label: 'Total Evaluation Time (s)', // Dataset label
                data: Object.values(totalEvalTimes), // Total evaluation times for each agent
                backgroundColor: agentColors // Agent colors for the chart bars
            }]
        },
        options: { // Chart options
            scales: {
                x: { // X-axis options
                    beginAtZero: true, // Start at zero
                    ticks: {
                        stepSize: 1 // Step size for tick marks
                    }
                }
            }
        }
    });
};

/**
 * Sets the status message in the HTML document.
 * @param {string} message - The message to display.
 * @param {boolean} [blink=false] - Whether to display a blinking icon before the message.
 */
const setStatusMessage = (message, blink = false) => {
    // Get the status message element from the HTML document
    const statusMessageElement = document.getElementById('statusMessage');
    
    // Set the innerHTML of the status message element
    // If blink is true, display a blinking icon before the message
    // Otherwise, display the message as is
    statusMessageElement.innerHTML = `${blink ? '<span class="blinking-icon">🤖</span>&nbsp;' : ''}${message}`;
};

// Add CSS for the blinking icon
const style = document.createElement('style');
style.textContent = `
.blinking-icon {
    animation: blinker 2s linear infinite;
}

@keyframes blinker {  
    50% { opacity: 0; }
}
`;
document.head.appendChild(style);

/**
 * Disables the "Start Game" and "Play Turn" buttons.
 * Disables the "Autopilot" checkbox if autopilot is not enabled.
 */
const disableButtons = () => {
    // Disable the "Start Game" button
    document.getElementById('startGame').disabled = true;
    
    // Disable the "Play Turn" button
    document.getElementById('nextTurn').disabled = true;
    
    // Disable the "Autopilot" checkbox if autopilot is not enabled
    if (!autopilot) {
        document.getElementById('autopilot').disabled = true;
    }
};

/**
 * Enables the "Start Game" and "Play Turn" buttons, and the "Autopilot" checkbox.
 */
const enableButtons = () => {
    // Enable the "Start Game" button
    document.getElementById('startGame').disabled = false;
    
    // Enable the "Play Turn" button
    document.getElementById('nextTurn').disabled = false;
    
    // Enable the "Autopilot" checkbox
    document.getElementById('autopilot').disabled = false;
};

/**
 * Updates the turn counter element on the UI with the current turn counter value.
 */
const updateTurnCounter = () => {
    // Get the turn counter element from the UI
    const turnCounterElement = document.getElementById('turnCounter');

    // Update the text content of the turn counter element with the current turn counter value
    turnCounterElement.textContent = `Turn: ${turnCounter}`;
};

/**
 * Clears the loser text content from the UI.
 */
const clearLoser = () => {
    // Get the loser element from the UI
    const loserElement = document.getElementById('loser');

    // Clear the text content of the loser element
    loserElement.textContent = '';
};


/**
 * Updates the loser element on the UI with the name of the loser agent.
 * @param {string} loser - The name of the loser agent.
 */
const showLoser = (loser) => {
    // Get the loser element from the UI
    const loserElement = document.getElementById('loser');

    // Update the text content of the loser element with the name of the loser agent
    loserElement.textContent = `Loser: ${loser}`;
};

/**
 * Starts the game by making a POST request to the server to initialize the game state.
 * If the request is successful, updates the UI with the initial game state and enables the "Autopilot" checkbox.
 * Otherwise, displays an alert with an error message.
 */
const startGame = async () => {
    // Set the status message to indicate that the game is starting
    setStatusMessage('Starting game...');
    // Disable the buttons to prevent further actions until the game starts
    disableButtons();

    // Make a POST request to the server to initialize the game state
    const response = await fetch('http://localhost:3000/start', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ machineJudgement: false }) // Set machineJudgement to false as the game is started
    });

    if (response.ok) {
        // If the request is successful, parse the response data
        const data = await response.json();
        // Clear the chat section of the UI
        document.getElementById('chat').innerHTML = '';
        // Enable the "Play Turn" button and the "Autopilot" checkbox
        document.getElementById('nextTurn').disabled = false;
        document.getElementById('autopilot').disabled = false;

        turnCounter = 0; // Reset the turn counter
        totalAgents = Object.keys(data.votes).length; // Get the total number of agents

        // Update the chat section of the UI with the initial message history
        updateChat(data.messageHistory);
        // Update the votes chart with the initial vote counts
        updateVotesChart(data.votes);
        // Update the evaluation times chart with the initial evaluation times
        updateEvalTimesChart(data.totalEvalTimes);

        // Update the turn counter element on the UI with the current turn counter value
        updateTurnCounter();
        // Clear the loser text content from the UI
        clearLoser();
        // Set the status message to indicate that the game has started
        setStatusMessage('Game started.');
        // If autopilot is enabled, automatically play the next turn
        if (autopilot) {
            runAutopilot();
        }
    } else {
        // If the request fails, display an alert with an error message
        alert('Error starting game.');
    }

    // If autopilot is not enabled, enable the buttons to allow further actions
    if (!autopilot) enableButtons();
}
