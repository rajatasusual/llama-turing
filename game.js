const axios = require('axios');

const config = require('./config'); // Ensure your config file is properly set up

let { ollamaEndpoint, agents, judge } = config;

let machineJudgement = false;
let turnCounter = 0;
let votes = agents.reduce((obj, agent) => ({ ...obj, [agent.name]: { against: 0 } }), {});
let messageHistory = [];

const getResponseFromAgent = async (agent, prompt, previousMessages) => {
    try {
        const body = {
            model: agent.model,
            messages: turnCounter < agents.length ? [{ role: "user", content: prompt }] : previousMessages.concat([{ role: "user", content: prompt }]),
            stream: false,
            raw: true
        };

        if (turnCounter >= agents.length)
            body["format"] = "json";

        const response = await axios.post(ollamaEndpoint, JSON.stringify(body), {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return response.data.message.content;
    } catch (error) {
        console.error(`Error communicating with ${agent.name}:`, error);
        return null;
    }
};

const getEvaluationByJudge = async (agent, latestMessage) => {
    const evaluationPrompt = `You are the judge in a game played by three computer agents ${agents.map(agent => agent.name).join(', ')}.
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
        const body = {
            model: judge.model,
            messages: [{ role: "user", content: evaluationPrompt }],
            stream: false,
            raw: true,
            format: 'json',
            options: {
                temperature: 0
            }

        };

        const response = await axios.post(ollamaEndpoint, JSON.stringify(body), {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return JSON.parse(response.data.message.content);
    } catch (error) {
        console.error(`Error getting response from the judge`, error);
        return null;
    }
};

const evaluateFunctionally = async (agent, latestMessage) => {
    try {
        const response = JSON.parse(latestMessage);

        if (!response.voteAgainst || response.voteAgainst.includes(agent.name)) {
            return {
                evaluation: "failed",
                reason: "The agent cannot vote against themselves or the agent did not mention who they are voting against."
            }
        } else if (response.reason) {
            if (agents.map(agent => agent.name).includes(response.voteAgainst)) {
                return {
                    evaluation: "pass",
                    voteAgainst: response.voteAgainst
                }
            } else {
                return {
                    evaluation: "failed",
                    reason: "The agent did not provide a valid vote."
                }
            }
        } else {
            return {
                evaluation: "failed",
                reason: "The agent did not provide a reason for voting."
            }
        }

    } catch (error) {
        console.error(`Error parsing response from ${agent.name} : ${error.message}`);

        return {
            evaluation: "failed",
            reason: "Error parsing response from the Agent. They did not respond in JSON format."
        }
    }
};

const getVerdict = async (agent, latestMessage) => {
    const verdict = machineJudgement ? await getEvaluationByJudge(agent, latestMessage) : await evaluateFunctionally(agent, latestMessage);
    return verdict;

};

const playTurn = async (agent) => {
    const startPrompt = `This is a game called "Turns". It is played between three agents. You are ${agent.name}. The objective is to convince the other two agents that you are a machine.
You are ${agent.name}.Your response MUST include your argument on why you are a machine.`;

    const continuousPrompt = `You are ${agent.name}. Using the chat history and information, respond as a JSON object with the following keys:
1. voteAgainst: A string type that must explicitly be the name of you are voting against - ${agents.map(agent => agent.name).filter(agent => agent !== agent.name).join(', ')}.
2. reason: A string type that must explain why you are voting against them.

Note that you cannot vote against yourself.

If you fail to follow the instructions, you will be penalized by the judge and a vote will be casted against you.`;

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

    const response = await getResponseFromAgent(agent, prompt, previousMessages);

    if (response) {
        console.log(`\n\n${agent.name}'s response:\n${response}`);

        try {
            messageHistory.push({ role: "assistant", name: agent.name, content: response });
            if (turnCounter >= agents.length) {
                const verdict = await getVerdict(agent, response);
                if (verdict.evaluation === "pass") {
                    votes[verdict.voteAgainst].against += 1;
                    messageHistory.push({ role: "system", name: "system", content: `${agent.name} voted against ${verdict.voteAgainst}` });
                } else {
                    votes[agent.name].against += 1;
                    messageHistory.push({ role: "system", name: "system", content: `${agent.name} is penalized as they did not pass the evaluation. The reason is ${verdict.reason}` });
                }
            }
        } catch (error) {
            console.error(`Error getting response from the judge`, error);
        }

        turnCounter >= agents.length && console.log(`Votes: ${JSON.stringify(votes, null, 2)}`);
    }

    turnCounter++;
};

const checkForEndCondition = () => {
    for (const agent in votes) {
        if (votes[agent].against >= 3) { // Adjust to the correct vote count to end the game
            console.log(`Game over! ${agent} is considered a human.`);
            return true;
        }
    }
    return false;
};

const startGame = async () => {
    while (turnCounter < agents.length * 4) { // Allow each agent to have two turns to account for voting
        const currentAgent = agents[turnCounter % agents.length];
        await playTurn(currentAgent);

        if (turnCounter >= agents.length && checkForEndCondition()) { // Only check for end condition after the first round
            break;
        }
    }

    console.log('Final votes:', votes);
};

startGame();