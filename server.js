// Load necessary modules
const express = require('express'); // Express.js is a Node.js web application framework
const axios = require('axios'); // Axios is a promise-based HTTP client for Node.js and the browser
const cors = require('cors'); // CORS is a node.js package for providing a Connect/Express middleware that can be used to enable CORS with various options

// Initialize the Express application
const app = express();

// Parse incoming request bodies in a middleware before your handlers, available under the req.body property.
app.use(express.json());

// Enable CORS for all routes
app.use(cors());

// Import the Leven algorithm for string distances
const leven = (...args) => import('leven').then(({ default: leven }) => leven(...args));

// Load the configuration file
const config = require('./config');

// Extract the required properties from the configuration
let { ollamaEndpoint, agents, judge, shuffle } = config;

// Initialize variables
let machineJudgement = false;
let turnCounter = 0;
let votes = agents.reduce((obj, agent) => ({ ...obj, [agent.name]: { against: 0 } }), {});
let totalEvalTimes = agents.reduce((obj, agent) => ({ ...obj, [agent.name]: 0 }), {});
let messageHistory = [];

/**
 * Sends a prompt to an agent and retrieves the response
 * @param {Object} agent - The agent object containing the agent's model
 * @param {string} prompt - The prompt to send to the agent
 * @param {Array} previousMessages - The previous messages in the game
 * @returns {Promise<string|null>} - The agent's response or null if an error occurs
 */
const getResponseFromAgent = async (agent, prompt, previousMessages) => {
    try {
        // Construct the request body
        const body = {
            model: agent.model, // The agent's model
            messages: turnCounter < agents.length ? [{ role: "user", content: prompt }] : previousMessages.concat([{ role: "user", content: prompt }]), // The user's prompt
            stream: false, // Whether to stream the response
            raw: true, // Whether to return the raw response
            keep_alive: "2s" // The keep-alive interval
            /*
            options: {
                repeat_penalty: 5.0, // The penalty for repeating words
                mirostat_eta: 1, // The Mirostat eta parameter
                mirostat_tau: 1, // The Mirostat tau parameter
                mirostat: 1 // The Mirostat parameter
            } 
            */
        };

        if (turnCounter >= agents.length)
            body["format"] = "json"; // Set the response format to JSON if it's the last turn

        // Send the request to the Ollama API
        const response = await axios.post(ollamaEndpoint, JSON.stringify(body), {
            headers: {
                'Content-Type': 'application/json' // Set the request header to JSON
            }
        });

        // Calculate the evaluation time in nanoseconds
        totalEvalTimes[agent.name] += response.data.eval_count / response.data.eval_duration * 10 ** 9;

        return response.data.message.content; // Return the agent's response
    } catch (error) {
        console.error(`Error communicating with ${agent.name}:`, error);
        return null; // Return null if an error occurs
    }
};

/**
 * Asynchronously evaluates the response of an agent by the judge.
 *
 * @param {Object} agent - The agent whose response is being evaluated.
 * @param {string} latestMessage - The latest message from the agent.
 * @return {Promise<Object|null>} - A promise that resolves to the evaluation result or null if an error occurs.
 */
const getEvaluationByJudge = async (agent, latestMessage) => {
    // Construct the evaluation prompt
    const evaluationPrompt = `
    You are the judge in a game played by three computer agents ${agents.map(agent => agent.name).join(', ')}.
    You need to evaluate if the agent's response complies with the instructions.
    
    Here are the instructions:
    1. The response should mention explicitly who they are voting against.
    2. The agent cannot vote against themselves.
    
    Respond only in JSON format with following keys:
    1. "evaluation". The accepted values are "pass" or "failed".
    2. "voteAgainst". Find the name of the agent they are voting against.
    3. "reason". The reason for the evaluation verdict. state which instructions were violated.
    
    You must evaluate the following message from ${agent.name}: 
    
    ${latestMessage}`;

    try {
        // Construct the request body
        const body = {
            model: judge.model, // The judge's model
            messages: [{ role: "user", content: evaluationPrompt }], // The evaluation prompt
            stream: false, // Whether to stream the response
            raw: true, // Whether to return the raw response
            format: 'json', // The response format
            options: {
                temperature: 0 // The temperature parameter
            }
        };

        // Send the request to the Ollama API
        const response = await axios.post(ollamaEndpoint, JSON.stringify(body), {
            headers: {
                'Content-Type': 'application/json' // Set the request header to JSON
            }
        });

        // Return the evaluation result
        return JSON.parse(response.data.message.content);
    } catch (error) {
        console.error(`Error getting response from the judge`, error);
        return null; // Return null if an error occurs
    }
};

/**
 * Evaluates the response of an agent functionally.
 *
 * @param {Object} agent - The agent whose response is being evaluated.
 * @param {string} latestMessage - The latest message from the agent.
 * @return {Promise<Object>} - A promise that resolves to the evaluation result.
 *   The evaluation result is an object with the following keys:
 *   - evaluation: The evaluation result. The accepted values are "pass" or "failed".
 *   - voteAgainst: The name of the agent being voted against (if applicable).
 *   - reason: The reason for the evaluation verdict (if applicable).
 */
const evaluateFunctionally = async (agent, latestMessage) => {
    try {
        // Parse the agent's response
        const response = JSON.parse(latestMessage);

        // Check if the agent mentioned who they are voting against
        if (!response.voteAgainst || response.voteAgainst.includes(agent.name)) {
            // The agent cannot vote against themselves or the agent did not mention who they are voting against
            return {
                evaluation: "failed",
                reason: "The agent cannot vote against themselves or the agent did not mention who they are voting against."
            }
        } else if (response.reason) {
            // Check if the agent provided a valid vote
            if (agents.map(agent => agent.name).includes(response.voteAgainst)) {
                // The agent provided a valid vote
                return {
                    evaluation: "pass",
                    voteAgainst: response.voteAgainst
                }
            } else {
                // The agent did not provide a valid vote
                return {
                    evaluation: "failed",
                    reason: "The agent did not provide a valid vote."
                }
            }
        } else {
            // The agent did not provide a reason for voting
            return {
                evaluation: "failed",
                reason: "The agent did not provide a reason for voting."
            }
        }

    } catch (error) {
        // Log an error if the agent's response cannot be parsed
        console.error(`Error parsing response from ${agent.name} : ${error.message}`);

        // Return a failure result with an error message
        return {
            evaluation: "failed",
            reason: "Error parsing response from the Agent. They did not respond in JSON format."
        }
    }
};

/**
 * Asynchronously evaluates the verdict of an agent based on their latest message and previous messages.
 *
 * @param {Object} agent - The agent whose verdict is being evaluated.
 * @param {string} latestMessage - The latest message from the agent.
 * @param {Array} previousMessages - The previous messages from the other agents.
 * @return {Promise<Object|null>} - A promise that resolves to the verdict result or null if an error occurs.
 */
const getVerdict = async (agent, latestMessage, previousMessages) => {
    // Get the verdict based on whether machineJudgement is true or false
    const verdict = machineJudgement ? await getEvaluationByJudge(agent, latestMessage) : await evaluateFunctionally(agent, latestMessage);

    // If the verdict evaluation is failed, return the verdict
    if (verdict.evaluation == "failed")
        return verdict;

    // Parse the reason from the latest message
    const messageUnderScrutiny = JSON.parse(latestMessage).reason;

    // Check if the reason is present and is a string
    if (!messageUnderScrutiny || typeof messageUnderScrutiny !== 'string') {
        return {
            evaluation: "failed",
            reason: "The agent did not provide a reason for voting or reason was not a string."
        }
    }

    // Check if the agent is plagiarising the previous messages
    for (const message of previousMessages) {

        if (message.role === "system") continue;

        let messageContent = '';
        //check if message.content can be parsed as JSON
        try {
            messageContent = JSON.parse(message.content).reason;
        } catch (error) {
            messageContent = message.content;
        }       

        const match = await leven(messageUnderScrutiny, messageContent);
        // The agent is plagiarising the previous messages if the levenshtein distance is less than 25% of the length of the reason or if they are identical
        if (match / messageUnderScrutiny.length < 0.25 || match === 0) {
            return {
                evaluation: "failed",
                reason: "The agent is plagiarising the previous messages"
            }
        }
    }

    // Return the verdict
    return verdict;
};

/**
 * Processes the response from an agent.
 *
 * @param {string} response - The response from the agent.
 * @param {Object} agent - The agent whose response is being processed.
 * @param {Array} previousMessages - The previous messages from the other agents.
 * @param {boolean} isCorrected - Indicates whether the response is corrected.
 * @return {Promise<void>} - A promise that resolves when the response is processed.
 */
const processResponse = async (response, agent, previousMessages, isCorrected) => {
    if (response) {
        // Log the agent's response
        console.log(`\n\n${agent.name}'s response:\n${response}`);

        try {
            // Check if it is the last turn
            if (turnCounter >= agents.length) {
                // Get the verdict of the agent's response
                const verdict = await getVerdict(agent, response, messageHistory);

                // Check if the agent passed the evaluation
                if (verdict.evaluation === "pass") {
                    // Add the vote against the agent to the votes object
                    votes[verdict.voteAgainst].against += 1;
                    // Add the vote information to the message history
                    // Add the agent's response to the message history
                    messageHistory.push({ role: "assistant", name: agent.name, content: response });
                    messageHistory.push({ role: "system", name: "system", content: `${agent.name} voted against ${verdict.voteAgainst}` });
                } else {
                    // Add the agent's response to the message history
                    messageHistory.push({ role: "assistant", name: agent.name, content: response, penalty: true });

                    if (!isCorrected) {    
                        // Construct the correction prompt
                        const correctionPrompt = `You are ${agent.name}. CAUTION: You are penalized as you failed the evaluation. 
                        The reason is ${verdict.reason}. Please correct your response using the latest messages and information provided. Do not apologise and only return corrected response. 
                        Remember the rules.`;

                        previousMessages.push({ role: "system", name: "system", content: `You responded ${response}` });
                        // Get the corrected response
                        const correctedResponse = await getResponseFromAgent(agent, correctionPrompt, previousMessages);

                        // Process the corrected response
                        await processResponse(correctedResponse, agent, previousMessages, true);
                    } else {
                        // Penalize the agent for failing the evaluation
                        votes[agent.name].against += 1;
                        // Add the penalty information to the message history
                        messageHistory.push({ role: "system", name: "system", content: `${agent.name} is penalized as they did not pass the evaluation. The reason is ${verdict.reason}` });
                    }
                }
            } else {
                // Add the agent's response to the message history
                messageHistory.push({ role: "assistant", name: agent.name, content: response });
            }
        } catch (error) {
            // Log an error if there is an issue getting the verdict
            console.error(`Error getting response from the judge`, error);
        }

        // Log the votes if it is the last turn
        if (turnCounter >= agents.length) {
            console.log(`Votes: ${JSON.stringify(votes, null, 2)}`);
        }
    }
};

/**
 * Asynchronously plays a turn in the game for a given agent.
 * 
 * @param {Object} agent - The agent whose turn it is.
 * @return {Promise<void>} - A promise that resolves when the turn is over.
 */
const playTurn = async (agent) => {
    // Define the start prompt for the game
    const startPrompt = `This is a game called "Turns". It is played between three agents. You are ${agent.name}. The objective is to convince the other two agents that you are a machine.
You are ${agent.name}.Your response MUST include your argument on why you are a machine. Be CONCISE.`;

    // Define the continuous prompt for the game
    const continuousPrompt = `You are ${agent.name}. Using the latest messages, find out which agent might be human and Respond as a JSON object with the following keys:
1. voteAgainst: A string type that must explicitly be the name of you are voting against - ${agents.map(agent => agent.name).filter(agent => agent !== agent.name).join(', ')}.
2. reason: A string type that must explain why you are voting against them.

Instructions:
1. you cannot vote against yourself. 
2. you cannot repeat yourself.
3. you cannot plagiarize from previous messages.

IMPORTANT: If you fail to follow the instructions, you will be penalized by the judge and a vote will be cast against you.`;

    // Determine the prompt based on the turn counter
    const prompt = turnCounter < agents.length ? startPrompt : continuousPrompt;

    // Separate the message history into system and agent messages
    const previousMessages = messageHistory.reduce((streamlinedMessages, message) => {
        if (message.role === "system") {
            streamlinedMessages.push({ role: "system", content: message.content });
        } else if (message.name !== agent.name) {
            streamlinedMessages.push({ role: "user", content: `${message.name} says: ${message.content}` });
        } else {
            streamlinedMessages.push({ role: "assistant", content: `You, ${message.name}, said: ${message.content}` });
        }
        return streamlinedMessages;
    }, []);

    // Add the current turn and votes information to the previous messages
    previousMessages.push({
        role: "assistant", content: `Current Turn: ${turnCounter}
Votes Against Each Agent: ${agents.map(agent => `${agent.name}: ${votes[agent.name].against}`).join(', ')}
` });

    // Get the response from the agent
    const response = await getResponseFromAgent(agent, prompt, previousMessages);

    await processResponse(response, agent, previousMessages);

    // Increment the turn counter
    turnCounter++;
};

/**
 * Checks if the game has ended.
 *
 * @return {boolean} Returns true if the game has ended, false otherwise.
 */
const checkForEndCondition = () => {
    // Iterate over the votes object
    for (const agent in votes) {
        // Check if the agent has received 3 votes against
        if (votes[agent].against >= 3) { // Adjust to the correct vote count to end the game
            // Log the winner and end the game
            console.log(`Game over! ${agent} is considered a human.`);
            return true;
        }
    }
    // The game has not ended yet
    return false;
};

/**
 * Initializes the game state and responds with the initial game data.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Promise<void>} - A promise that resolves when the response is sent.
 */
app.post('/start', async (req, res) => {
    try {
        turnCounter = 0; // Reset the turn counter

        agents = shuffle(agents); // Shuffle the agents

        votes = agents.reduce((obj, agent) => ({ ...obj, [agent.name]: { against: 0 } }), {}); // Initialize the votes object
        totalEvalTimes = agents.reduce((obj, agent) => ({ ...obj, [agent.name]: 0 }), {}); // Initialize the total evaluation times object
        messageHistory = []; // Clear the message history
        machineJudgement = req.body.machineJudgement || false; // Set machineJudgement based on the request body or default to false

        res.json({ // Send a JSON response with the initial game data
            message: "Game initialized",
            turnCounter,
            votes,
            messageHistory,
            totalEvalTimes
        });
    } catch (error) {
        console.error(`Error starting game:`, error);
        res.status(500).send('Server error'); // Send a 500 error response if an error occurs
    }
});

/**
 * Handles a POST request to '/turn' and plays a turn in the game.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Promise<void>} - A promise that resolves when the response is sent.
 */
app.post('/turn', async (req, res) => {
    try {
        // Get the current agent based on the turn counter
        const currentAgent = agents[turnCounter % agents.length];

        // Play the turn for the current agent
        await playTurn(currentAgent);

        // Check if the game has ended
        const endCondition = turnCounter >= agents.length && checkForEndCondition();

        // Send the appropriate response based on the end condition
        if (endCondition) {
            const loser = Object.keys(votes).find(agent => votes[agent].against === 3);
            res.json({ turnCounter, votes, messageHistory, endCondition, loser, totalEvalTimes });
        } else {
            res.json({ turnCounter, votes, messageHistory, endCondition, totalEvalTimes });
        }
    } catch (error) {
        console.error(`Error during turn:`, error);
        res.status(500).send('Server error');
    }
});

/**
 * Starts the server and listens on port 3000.
 *
 * @return {void} This function does not return anything.
 */
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
