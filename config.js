const SEED = 42;

function shuffle(array) {
    let m = array.length, t, i;

    let seed = SEED;

    while (seed) {
        // While there remain elements to shuffle…
        while (m) {

            // Pick a remaining element…
            i = Math.floor(Math.random() * m--);

            // And swap it with the current element.
            t = array[m];
            array[m] = array[i];
            array[i] = t;
        }

        seed--;
    }

    return array;
}

module.exports = {
    ollamaEndpoint: 'http://localhost:11434/api/chat', // Ollama API endpoint
    agents: shuffle([
        { name: 'Alpha', model: 'gemma:2b' },
        { name: 'Beta', model: 'phi3' },
        { name: 'Gamma', model: 'qwen:4b' }
    ]),
    judge: { name: 'Judge', model: 'llama3.1:8b' },
    shuffle
};