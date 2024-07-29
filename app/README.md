# README

## Tuning the Tables:  Game Interface

Welcome to the Turing the Tables Game Interface! This project provides an interactive way to engage with AI agents, visualize their interactions, and track their performance in real-time. Below are instructions on how to use the interface and interact with the game.

## Example Turn Flow

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

### Getting Started

1. **Open the Interface**: Ensure you have the application running on your local server. Open the interface in your web browser (usually found at `http://localhost:3000`).

### Interface Overview

The interface is divided into several sections:

1. **Control Panel**: Contains buttons to start the game, play the next turn, and enable/disable autopilot mode.
2. **Chat Box**: Displays the messages exchanged by the agents and the system.
3. **Votes Chart**: Visualizes the votes against each agent.
4. **Evaluation Times Chart**: Shows the total evaluation times for each agent.
5. **Status Message**: Displays the current status of the game.
6. **Turn Counter**: Tracks the number of turns taken.
7. **Loser Display**: Indicates the losing agent if the game ends.

### Usage

#### Starting the Game

1. **Start Game**: Click the **Start Game** button to initialize the game. This will reset the game state, clear previous chat messages, and set up the initial charts.

#### Playing Turns

1. **Next Turn**: Click the **Next Turn** button to execute a turn. Each turn involves the following steps:
   - The game sends a request to the server to process the turn.
   - The chat box updates with the latest messages from the agents.
   - The votes chart and evaluation times chart are updated with new data.
   - The turn counter is incremented.
   - The status message is updated to indicate the progress of the game.
   - If a game-ending condition is met, the losing agent is displayed and the game stops.

#### Autopilot Mode

1. **Enable Autopilot**: Check the **Autopilot** checkbox to enable automatic execution of turns. In this mode, the game continuously plays turns until the game ends. If the game is not started, enabling autopilot will automatically start the game.
2. **Disable Autopilot**: Uncheck the **Autopilot** checkbox to stop automatic execution and return to manual turn control.

### Visualizations

#### Chat Box

- The chat box displays messages from both the system and agents.
- System messages are styled differently from agent messages.
- Each agent's message is color-coded for easy identification.
- Long messages are truncated with a "Read more" link for detailed viewing.

#### Votes Chart

- The votes chart displays the number of votes against each agent.
- Bars in the chart are color-coded to match the agents.
- The chart updates dynamically after each turn.

#### Evaluation Times Chart

- The evaluation times chart shows the total evaluation times for each agent.
- Like the votes chart, it is color-coded and updates dynamically.

### Status and Turn Information

- **Status Message**: Provides real-time feedback about the game's progress, such as when a turn is processing or when the game is over.
- **Turn Counter**: Displays the current turn number.
- **Loser Display**: Shows the name of the losing agent when the game ends.

### Advanced Features

- **Character Limit for Messages**: Long messages are truncated to improve readability, with an option to expand and view the full message.
- **Color Coding**: Each agent is assigned a unique color for easy identification in charts and messages.

### Error Handling

- If an error occurs during a turn or game initialization, an alert will notify you of the issue, allowing you to take corrective action.

### Conclusion

This Game Interface offers a comprehensive and interactive way to engage with AI agents, track their progress, and visualize their interactions. By following this README, you can effectively use the interface to start games, play turns, and enable autopilot mode, all while monitoring the agents' performance through dynamic charts and real-time messages. Enjoy exploring the world of AI agents!