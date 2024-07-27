let chart = null;
let turnCounter = 0;
let autopilot = false;

const MAX_CHAR_LIMIT = 200;

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

const executeTurn = async () => {
    setStatusMessage('Processing turn...', true);
    disableButtons();

    const response = await fetch('http://localhost:3000/turn', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (response.ok) {
        const data = await response.json();
        updateChat(data.messageHistory);
        updateChart(data.votes);
        turnCounter = data.turnCounter;
        updateTurnCounter();

        if (data.endCondition) {
            document.getElementById('nextTurn').disabled = true;
            document.getElementById('autopilot').disabled = true;
            document.getElementById('startGame').disabled = false;
            showLoser(data.loser);
            setStatusMessage('Game over.');
        } else {
            setStatusMessage('Turn completed.');
            if (autopilot) {
                runAutopilot();
            }
        }
    } else {
        alert('Error during turn.');
    }

    if (!autopilot)
        enableButtons();
};

const runAutopilot = async () => {
    autopilot = document.getElementById('autopilot').checked;
    if (autopilot) {
        await executeTurn();
    }
};

const processMessage = (message) => {
    try {
        const structuredMessage = JSON.parse(message.content);
        return `${Object.keys(structuredMessage).map(key => `<b>${key}</b>: ${structuredMessage[key]}`).join('<br>')}`
    } catch (error) {
        return `<b>${message.name}</b>: ${message.content}`;
    }
};

const updateChat = (messageHistory) => {
    const chatBox = document.getElementById('chat');
    chatBox.innerHTML = '';
    messageHistory.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.className = 'message ' + (message.role === 'system' ? 'system' : 'agent');

        const iconElement = document.createElement('span');
        iconElement.className = 'icon';
        iconElement.textContent = getIcon(message.name);

        const contentElement = document.createElement('span');
        const fullMessage = processMessage(message);
        let displayMessage = fullMessage;

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

        messageElement.appendChild(iconElement);
        messageElement.appendChild(contentElement);

        chatBox.appendChild(messageElement);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
};

const getIcon = (name) => {
    return name.split('')[0].toUpperCase();
};

const updateChart = (votes) => {
    const ctx = document.getElementById('votesChart').getContext('2d');

    // Update chart
    if (chart) { // If chart exists, update it
        chart.data.datasets[0].data = Object.values(votes).map(vote => vote.against);
        chart.update();
        return;
    }
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(votes),
            datasets: [{
                label: 'Votes Against',
                data: Object.values(votes).map(vote => vote.against),
                backgroundColor: ['#FFC995', '#35A1CB', '#1A2A73']
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 3,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
};

const setStatusMessage = (message, blink = false) => {
    const statusMessageElement = document.getElementById('statusMessage');
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

const disableButtons = () => {
    document.getElementById('startGame').disabled = true;
    document.getElementById('nextTurn').disabled = true;
    if (!autopilot) document.getElementById('autopilot').disabled = true;
};

const enableButtons = () => {
    document.getElementById('startGame').disabled = false;
    document.getElementById('nextTurn').disabled = false;
    document.getElementById('autopilot').disabled = false;
};

const updateTurnCounter = () => {
    document.getElementById('turnCounter').textContent = `Turn: ${turnCounter}`;
};

const clearLoser = () => {
    document.getElementById('loser').textContent = '';
};

const showLoser = (loser) => {
    document.getElementById('loser').textContent = `Loser: ${loser}`;
};

const startGame = async () => {
    setStatusMessage('Starting game...');
    disableButtons();

    const response = await fetch('http://localhost:3000/start', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ machineJudgement: false })
    });

    if (response.ok) {
        const data = await response.json();
        document.getElementById('chat').innerHTML = ''; // Clear chat
        document.getElementById('nextTurn').disabled = false;
        document.getElementById('autopilot').disabled = false;
        updateChat(data.messageHistory);
        updateChart(data.votes);
        turnCounter = 0;
        updateTurnCounter();
        clearLoser();
        setStatusMessage('Game started.');
        if (autopilot) {
            runAutopilot();
        }
    } else {
        alert('Error starting game.');
    }

    if (!autopilot) enableButtons();
}