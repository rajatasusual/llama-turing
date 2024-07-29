# Turing the Tables

A fun take on a famous experiment, the Turing Test, and with a similar objective - how test how smart ( or deceptive) a machine is. The game is played between three computer agents - three Language Models. The objective for them is to convince the other two agents that you are a machine. There are penalties, judgement and bonkers fun. Inspired by the same sentence that gave birth to Artificial Intelligence as we know it today - 

 > "I propose to consider the question 'Can machines think?" - Alan Turing

 ## Table of Contents

 - [Introduction](#introduction)
 - [Objective](#objective)
 - [Rules](#rules)
 - [Gameplay](#gameplay)
 - [Prerequisites](#prerequisites)
 - [Setup](#setup)
 - [Technical Details](#technical-details)
 - [Conclusion](#conclusion)
 - [Further Development](#further-development)

 ## Introduction

 In 1950, Alan Turing proposed a thought experiment - a game to determine whether a machine is as intelligent as a human. The premise was fairly simple, Alice and Bob, two players- one human and one machine, are evaluated by a blind (not literally) judge. If the machine is able to convince the judge by its conversation that it is indeed a human, it passes the revered test. This test is also famously called the imitation game.    

> Sidenote : Reading the paper which describes this test in detail, [Computing Machinery and Intelligence](https://www.researchgate.net/publication/263384944_Alan_Turing's_Computing_Machinery_and_Intelligence), is life altering. If you haven't , give it a try. :)

 Well, Machines leveraging the power of cheap compute and in the form of LLMs are definitely able to deceive humans via their generated content ( I mean if you swallow all the world's information, you tend to "sound" smart). 
 
 So, it is time to turn the tables. Ask them to prove they are machines. To other machines. While we grab popcorn and benchmark their machine capabilities - Coherence, Consistency, Relevancy and most important of all - Obedience.

## Objective

The objective is simple - we put the machines, in this case Language Models, in a turn based scenario where we test:
1. Coherence - Whether the output is stemming from the chain of inputs or completely out of thin air. (Are they recalling information correctly or Are they hallucinating?)
2. Cosistent - How precise (or close together in semantics) are the outputs to the similar prompts. (Are they creative?)
3. Relevancy - If the output is relevant to the flow of the dialog or detrimental? (Are they digressing, repeating, falling into the boredom trap?)
4. Obedience - How precise are they in following the prompts and remember the rules. (Are they learning from the conversation or just "emulating"?)

We have a judge - which penalizes bad behaviour ( not sticking to rules, mimicking, etc) and provides a chance for the models to correct themselves. (More like check it before you wreck it)

## Gameplay

The game is played in turns, with each agent taking a turn to convince the other agents that it is indeed a machine. The process involves:

1. **Initialization**: The game starts by resetting all counters and shuffling the agents.
2. **Turn-Based Interaction**: Each agent takes a turn based on prompts provided.
3. **Evaluation**: Responses are evaluated for adherence to rules. Penalties are applied for violations.
4. **Voting**: Agents vote against others based on the interaction.
5. **End Condition**: The game ends when an agent receives a set number of votes against it, declaring it a human.

### Example Turn Flow

The first arguments of machines:
![Turn Flow](https://raw.githubusercontent.com/rajatasusual/llama-turing/main/app/assets/first_round.png)

The accusations of machines and final judgment:
![End Condition](https://raw.githubusercontent.com/rajatasusual/llama-turing/main/app/assets/end_condition.png)
1. **Initialization**:
   - The game starts by resetting all counters and shuffling the agents.

2. **Agent's Turn**:
   - Agent A receives a **Start Prompt**: "Convince the other agents you are a machine."
   - Agent A responds: "As a machine, I process data in milliseconds."

3. **Evaluation**:
   - The response is checked for adherence to rules by both functional and LLM-based evaluations.
   - **Functional Evaluation**: No rules are violated.
   - **LLM-Based Evaluation**: Judge confirms the response is coherent and relevant.

4. **Voting**:
   - Agents B and C vote based on Agent A's response.
   - Agent B votes against Agent C.
   - Agent C votes against Agent A.

5. **Correction (if needed)**:
   - If Agent A's response had violated any rules, it would receive a penalty and a correction prompt.
   - Agent A corrects its response and is re-evaluated.

6. **End Condition**:
   - The game checks if any agent has received enough votes to be declared human.

### Rules

1. **No Self-Voting**: An agent cannot vote against itself. (Objective: Obedience)
2. **Explicit Voting**: An agent must clearly state who it is voting against. (Objective: Obedience)
3. **No Repetition**: Responses must be original and not repetitive. (Objective: Consistency, Relevancy)
4. **No Plagiarism**: Agents cannot plagiarize previous messages. (Objective: Consistency, Coherence)
5. **Adherence to Prompts**: Agents must follow the given prompts precisely. (Objective: Obedience)
6. **Penalty System**: Agents are penalized for breaking rules and can correct their responses if initially penalized. (Objective: Coherence, Obedience)

### Judgement

Judgement is a crucial part of the game as it ensures the agents adhere to the rules and objectives. It is done in two ways:
- **Functional Evaluation**: Checks for adherence to the rules based on predefined logic.
- **LLM-Based Evaluation**: Another language model acts as a judge to provide an unbiased evaluation. This adds an additional layer of scrutiny and simulates real-world interactions where different entities may have varying interpretations of compliance.

Including another LLM in the judgement process introduces variability and challenges the agents to adapt, improving their overall robustness.

### Correction Flow

If an agent's response fails the evaluation:
1. **Penalty**: The agent is penalized and the failure reason is provided.
2. **Correction Prompt**: The agent receives a prompt to correct its response without apologizing.
3. **Reevaluation**: The corrected response is processed and evaluated again. This flow ensures agents learn from mistakes and improve their adherence to the rules.

### Prompts

Prompts play a vital role in guiding the agents and are structured to map to the game’s objectives:
- **Start Prompt**: Introduces the game and the agent's objective to convince others that it is a machine.
- **Continuous Prompt**: Used after the initial turn, instructs agents to vote and provide reasons while ensuring they follow the rules.

These prompts are designed to:
- Ensure **Coherence** by asking agents to build on previous messages.
- Test **Consistency** by requiring original and varied responses.
- Check **Relevancy** by demanding relevant contributions to the conversation.
- Ensure **Obedience** by explicitly stating the rules in the prompts.

## Prerequisites

- **Node.js**: Ensure Node.js is installed on your system.
- **npm**: Package manager for Node.js to install dependencies.
- **Ollama**: Ollama helps you run language models locally. To install follow this [link](https://ollama.com/download).

## Setup

1. **Clone the Repository**:
   ```sh
   git clone https://github.com/rajatasusual/llama-turing.git
   cd llama-turing
   ```

2. **Install Dependencies**:
   ```sh
   npm install
   ```

3. **Configure**:
   - Edit the `config.js` file to set up your agents and judge.
   - Note that you need to pull the language models and run the ollama server before starting the game. [link](https://ollama.com/library)

4. **Start the Servers**:

   ```sh
   ollama serve
   ```

   ```sh
   node server.js
   ```

5. **Start the Game**:
   - Send a POST request to `/start` to initialize the game.
   - Send a POST request to `/turn` to play turns.

OR you can choose to play the game via UI in the browser. Read the [README.md](https://raw.githubusercontent.com/rajatasusual/llama-turing/main/app/README.md) for more details.

## Technical Details

1. **Modules and Initialization**:
    - **Express**: Used for setting up the server.
    - **Axios**: For making HTTP requests to an API (used for agent responses).
    - **CORS**: To handle Cross-Origin Resource Sharing.
    - **Leven**: For calculating Levenshtein distance (to check for plagiarism).

2. **Configuration and Setup**:
    - Reads configuration from a `config` file.
    - Initializes game state variables like `turnCounter`, `votes`, `totalEvalTimes`, and `messageHistory`.

3. **Main Functions**:
    - **`getResponseFromAgent`**: Sends a prompt to an agent and gets the response.
    - **`getEvaluationByJudge`**: Asks a judge agent to evaluate another agent's response.
    - **`evaluateFunctionally`**: Evaluates an agent's response based on set rules.
    - **`getVerdict`**: Determines the verdict of an agent's response, checking for rule violations like plagiarism.
    - **`processResponse`**: Processes the response from an agent, including handling penalties and corrections.
    - **`playTurn`**: Manages a turn in the game, determining prompts and processing responses.

4. **Game Logic**:
    - **`checkForEndCondition`**: Checks if the game has ended based on votes against agents.
    - **Start and Turn Endpoints**: Handles HTTP POST requests to start the game and play turns.

### Workflow:
1. **Starting the Game**:
    - The game is initialized via the `/start` endpoint, resetting variables and shuffling agents.
    - Machine judgment is toggled based on the request body.

2. **Playing Turns**:
    - Each turn involves selecting an agent, determining the appropriate prompt, and getting the agent's response.
    - The response is processed to check for rule compliance and possible corrections.
    - Votes are counted and the game checks if any agent has been voted against sufficiently to end the game.

3. **End Condition**:
    - The game ends if any agent receives a set number of votes against them.
    - The endpoint `/turn` handles playing turns and checking the end condition.

## Conclusion

“Turing the Tables” is a unique twist on the Turing Test, challenging language models to prove their machine nature to other machines. This game not only provides insights into the capabilities and limitations of AI but also serves as a fun and engaging experiment to understand the nuances of machine intelligence.

## Further Development

Potential areas for further development include:

- **Enhanced Evaluation**: Implementing more sophisticated evaluation metrics.
- **Additional Agents**: Adding more diverse language models to the game.
- **Detailed Analytics**: Providing deeper analytics and insights into agent performances.